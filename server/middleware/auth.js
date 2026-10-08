const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'expense_reimburse_super_secret_key_2024';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let user = null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, department, avatar')
        .eq('id', decoded.id)
        .single();
      if (!error && data) user = data;
    } catch (dbErr) {
      // Supabase unavailable
    }

    // Fallback to verified token payload
    if (!user && decoded.id) {
      user = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        department: decoded.department,
        avatar: decoded.avatar
      };
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
