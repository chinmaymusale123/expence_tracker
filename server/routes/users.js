const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, avatar, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({ users: users || [], total: (users || []).length });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Employees can only view their own profile
    if (req.user.role === 'employee' && req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, avatar, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Create user (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check existing
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: ['employee', 'manager', 'admin'].includes(role) ? role : 'employee',
        department: department || 'General',
        avatar
      }])
      .select('id, name, email, role, department, avatar, created_at')
      .single();

    if (error) {
      console.error('Create user DB error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:id - Update user
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // Employees can only update their own profile
    if (req.user.role === 'employee' && req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, department, password } = req.body;
    const updates = {};

    if (name) {
      updates.name = name;
      updates.avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (department) updates.department = department;
    if (password) updates.password = await bcrypt.hash(password, 10);

    // Only admins can change roles
    if (req.body.role && req.user.role === 'admin') {
      updates.role = req.body.role;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, role, department, avatar, created_at')
      .single();

    if (error || !user) {
      console.error('Update user DB error:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) return res.status(404).json({ error: 'User not found' });

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete user DB error:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
