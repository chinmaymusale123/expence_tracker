const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

const fs = require('fs');
const os = require('os');

// Multer storage for receipts (safe for both local and serverless/Vercel)
const getUploadDir = () => {
  const localDir = path.join(__dirname, '../../public/uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch (err) {
    return os.tmpdir();
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only images and PDF files are allowed'));
  }
});

// GET /api/expenses - Get expenses (filtered by role)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, startDate, endDate, search } = req.query;

    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    // Employees only see their own expenses
    if (req.user.role === 'employee') {
      query = query.eq('user_id', req.user.id);
    }

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data: expenses, error } = await query;

    if (error || !expenses) {
      const mockDB = require('../config/mockDB');
      return res.json(mockDB.findExpenses({
        status, category, startDate, endDate, search,
        role: req.user.role,
        userId: req.user.id
      }));
    }

    let result = expenses || [];

    // Search filter (client-side after DB fetch)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.user_name?.toLowerCase().includes(q)
      );
    }

    res.json({ expenses: result, total: result.length });
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/expenses/pending - Get pending expenses for manager/admin
router.get('/pending', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !expenses) {
      const mockDB = require('../config/mockDB');
      return res.json(mockDB.getPendingForManager(req.user.department));
    }

    res.json({ expenses: expenses || [], total: (expenses || []).length });
  } catch (err) {
    const mockDB = require('../config/mockDB');
    res.json(mockDB.getPendingForManager(req.user?.department));
  }
});

// GET /api/expenses/stats - Get analytics stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    let query = supabase.from('expenses').select('*');

    if (req.user.role === 'employee') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: expenses, error } = await query;

    if (error || !expenses) {
      const mockDB = require('../config/mockDB');
      return res.json(mockDB.getStats(req.user.role, req.user.id));
    }

    const all = expenses || [];

    // Compute stats
    const stats = {
      total: all.length,
      pending: all.filter(e => e.status === 'pending').length,
      approved: all.filter(e => e.status === 'approved').length,
      rejected: all.filter(e => e.status === 'rejected').length,
      total_amount: all.reduce((sum, e) => sum + Number(e.amount), 0),
      approved_amount: all.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0),
      pending_amount: all.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0)
    };

    // By category
    const categoryMap = {};
    all.forEach(e => {
      if (!categoryMap[e.category]) categoryMap[e.category] = { count: 0, amount: 0 };
      categoryMap[e.category].count++;
      categoryMap[e.category].amount += Number(e.amount);
    });
    const byCategory = Object.entries(categoryMap).map(([name, data]) => ({ name, ...data }));

    // Monthly trend
    const monthMap = {};
    all.forEach(e => {
      const month = (e.date || e.created_at || '').substring(0, 7);
      if (!month) return;
      if (!monthMap[month]) monthMap[month] = { month, amount: 0, count: 0 };
      monthMap[month].amount += Number(e.amount);
      monthMap[month].count++;
    });
    const monthlyTrend = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    res.json({ stats, byCategory, monthlyTrend });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/expenses/:id - Get single expense
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: expense, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !expense) return res.status(404).json({ error: 'Expense not found' });

    // Employees can only see their own expenses
    if (req.user.role === 'employee' && expense.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ expense });
  } catch (err) {
    console.error('Get expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/expenses - Submit new expense
router.post('/', authenticate, upload.single('receipt'), async (req, res) => {
  try {
    const { title, amount, currency, category, date, description } = req.body;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ error: 'Title, amount, category, and date are required' });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: req.user.id,
        user_name: req.user.name,
        title: title.trim(),
        amount: parseFloat(amount),
        currency: currency || 'INR',
        category,
        date,
        description: description?.trim() || null,
        receipt_url: req.file ? `/uploads/${req.file.filename}` : null,
        status: 'pending',
        manager_comment: null,
        reviewed_by: null,
        reviewed_at: null
      }])
      .select()
      .single();

    if (error || !expense) {
      const mockDB = require('../config/mockDB');
      const mockExpense = mockDB.createExpense({
        userId: req.user.id,
        userName: req.user.name,
        title: title.trim(),
        amount: parseFloat(amount),
        currency: currency || 'INR',
        category,
        date,
        description: description?.trim() || null,
        receiptUrl: req.file ? `/uploads/${req.file.filename}` : null
      });
      return res.status(201).json({ message: 'Expense submitted successfully', expense: mockExpense });
    }

    res.status(201).json({ message: 'Expense submitted successfully', expense });
  } catch (err) {
    const mockDB = require('../config/mockDB');
    const mockExpense = mockDB.createExpense({
      userId: req.user.id,
      userName: req.user.name,
      title: req.body.title || 'Expense',
      amount: parseFloat(req.body.amount) || 1000,
      currency: req.body.currency || 'INR',
      category: req.body.category || 'Other',
      date: req.body.date || new Date().toISOString().split('T')[0],
      description: req.body.description || null,
      receiptUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
    res.status(201).json({ message: 'Expense submitted successfully', expense: mockExpense });
  }
});

// PATCH /api/expenses/:id/review - Approve or reject expense
router.patch('/:id/review', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { status, manager_comment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('expenses')
      .select('id, status')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Expense not found' });
    if (existing.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending expenses can be reviewed' });
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .update({
        status,
        manager_comment: manager_comment || null,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Review expense DB error:', error);
      return res.status(500).json({ error: 'Failed to update expense' });
    }

    res.json({ message: `Expense ${status} successfully`, expense });
  } catch (err) {
    console.error('Review expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('id, user_id, status')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !expense) return res.status(404).json({ error: 'Expense not found' });

    if (req.user.role === 'employee') {
      if (expense.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (expense.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending expenses can be deleted' });
      }
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete expense DB error:', error);
      return res.status(500).json({ error: 'Failed to delete expense' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
