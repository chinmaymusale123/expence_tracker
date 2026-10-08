const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'expense_reimburse_super_secret_key_2024';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department, avatar: user.avatar },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, role = 'employee' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check existing user
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
    const safeRole = ['employee', 'manager', 'admin'].includes(role) ? role : 'employee';

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: safeRole,
        department: department || 'General',
        avatar
      }])
      .select('id, name, email, role, department, avatar, created_at')
      .single();

    if (error) {
      console.error('Register DB error:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department, avatar: user.avatar },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ message: 'Account created successfully', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
