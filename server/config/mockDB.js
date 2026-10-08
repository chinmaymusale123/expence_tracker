// Mock database for demo purposes when Supabase is not configured
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-memory store
let users = [
  {
    id: 'user-1',
    name: 'John Employee',
    email: 'employee@demo.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'employee',
    department: 'Engineering',
    avatar: 'JE',
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'user-2',
    name: 'Sarah Manager',
    email: 'manager@demo.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'manager',
    department: 'Engineering',
    avatar: 'SM',
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'user-3',
    name: 'Admin User',
    email: 'admin@demo.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'admin',
    department: 'HR',
    avatar: 'AU',
    created_at: new Date('2024-01-01').toISOString()
  },
  {
    id: 'user-4',
    name: 'Alice Developer',
    email: 'alice@demo.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'employee',
    department: 'Engineering',
    avatar: 'AD',
    created_at: new Date('2024-01-15').toISOString()
  },
  {
    id: 'user-5',
    name: 'Bob Marketing',
    email: 'bob@demo.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'employee',
    department: 'Marketing',
    avatar: 'BM',
    created_at: new Date('2024-02-01').toISOString()
  }
];

let expenses = [
  {
    id: 'exp-1',
    user_id: 'user-1',
    user_name: 'John Employee',
    title: 'Client Lunch Meeting',
    amount: 2500,
    currency: 'INR',
    category: 'Food & Dining',
    date: '2024-10-01',
    description: 'Lunch with potential client at The Grand Hotel',
    status: 'approved',
    receipt_url: null,
    manager_comment: 'Approved. Good client engagement.',
    reviewed_by: 'user-2',
    reviewed_at: new Date('2024-10-03').toISOString(),
    created_at: new Date('2024-10-01').toISOString()
  },
  {
    id: 'exp-2',
    user_id: 'user-1',
    user_name: 'John Employee',
    title: 'Travel to Bangalore Conference',
    amount: 8500,
    currency: 'INR',
    category: 'Travel',
    date: '2024-10-05',
    description: 'Round trip flight to TechConf 2024 in Bangalore',
    status: 'pending',
    receipt_url: null,
    manager_comment: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date('2024-10-05').toISOString()
  },
  {
    id: 'exp-3',
    user_id: 'user-1',
    user_name: 'John Employee',
    title: 'Office Supplies',
    amount: 1200,
    currency: 'INR',
    category: 'Office Supplies',
    date: '2024-09-28',
    description: 'Notebooks, pens, and printer cartridges',
    status: 'rejected',
    receipt_url: null,
    manager_comment: 'Please use company-provided supplies.',
    reviewed_by: 'user-2',
    reviewed_at: new Date('2024-09-30').toISOString(),
    created_at: new Date('2024-09-28').toISOString()
  },
  {
    id: 'exp-4',
    user_id: 'user-4',
    user_name: 'Alice Developer',
    title: 'AWS Course Subscription',
    amount: 4999,
    currency: 'INR',
    category: 'Training & Education',
    date: '2024-10-02',
    description: 'AWS Solutions Architect certification course',
    status: 'pending',
    receipt_url: null,
    manager_comment: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date('2024-10-02').toISOString()
  },
  {
    id: 'exp-5',
    user_id: 'user-5',
    user_name: 'Bob Marketing',
    title: 'Social Media Ads Budget',
    amount: 15000,
    currency: 'INR',
    category: 'Marketing',
    date: '2024-10-03',
    description: 'Q4 social media advertising campaign',
    status: 'approved',
    receipt_url: null,
    manager_comment: 'Approved for Q4 campaign.',
    reviewed_by: 'user-2',
    reviewed_at: new Date('2024-10-04').toISOString(),
    created_at: new Date('2024-10-03').toISOString()
  },
  {
    id: 'exp-6',
    user_id: 'user-4',
    user_name: 'Alice Developer',
    title: 'Team Dinner - Sprint Celebration',
    amount: 6800,
    currency: 'INR',
    category: 'Food & Dining',
    date: '2024-09-30',
    description: 'Team dinner to celebrate successful sprint delivery',
    status: 'approved',
    receipt_url: null,
    manager_comment: 'Great team performance!',
    reviewed_by: 'user-2',
    reviewed_at: new Date('2024-10-01').toISOString(),
    created_at: new Date('2024-09-30').toISOString()
  },
  {
    id: 'exp-7',
    user_id: 'user-1',
    user_name: 'John Employee',
    title: 'Uber rides for client visits',
    amount: 890,
    currency: 'INR',
    category: 'Transportation',
    date: '2024-10-06',
    description: 'Multiple Uber rides for client site visits',
    status: 'pending',
    receipt_url: null,
    manager_comment: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date('2024-10-06').toISOString()
  },
  {
    id: 'exp-8',
    user_id: 'user-5',
    user_name: 'Bob Marketing',
    title: 'Design Software License',
    amount: 3500,
    currency: 'INR',
    category: 'Software & Tools',
    date: '2024-10-04',
    description: 'Annual Figma subscription for design work',
    status: 'pending',
    receipt_url: null,
    manager_comment: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date('2024-10-04').toISOString()
  }
];

const mockDB = {
  // Users
  findUserByEmail: (email) => users.find(u => u.email === email),
  findUserById: (id) => users.find(u => u.id === id),
  getAllUsers: () => users.map(u => ({ ...u, password: undefined })),
  createUser: (data) => {
    const user = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
    users.push(user);
    return { ...user, password: undefined };
  },
  updateUser: (id, data) => {
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      return { ...users[idx], password: undefined };
    }
    return null;
  },
  deleteUser: (id) => {
    users = users.filter(u => u.id !== id);
  },

  // Expenses
  getAllExpenses: () => [...expenses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  getExpensesByUser: (userId) => expenses.filter(e => e.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  getPendingExpenses: () => expenses.filter(e => e.status === 'pending').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  getExpenseById: (id) => expenses.find(e => e.id === id),
  createExpense: (data) => {
    const expense = {
      id: `exp-${uuidv4()}`,
      ...data,
      status: 'pending',
      manager_comment: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString()
    };
    expenses.push(expense);
    return expense;
  },
  updateExpense: (id, data) => {
    const idx = expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      expenses[idx] = { ...expenses[idx], ...data };
      return expenses[idx];
    }
    return null;
  },
  deleteExpense: (id) => {
    expenses = expenses.filter(e => e.id !== id);
  },

  // Analytics
  getStats: (userId = null) => {
    const filtered = userId ? expenses.filter(e => e.user_id === userId) : expenses;
    return {
      total: filtered.length,
      pending: filtered.filter(e => e.status === 'pending').length,
      approved: filtered.filter(e => e.status === 'approved').length,
      rejected: filtered.filter(e => e.status === 'rejected').length,
      total_amount: filtered.reduce((sum, e) => sum + e.amount, 0),
      approved_amount: filtered.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
      pending_amount: filtered.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)
    };
  },
  getByCategory: (userId = null) => {
    const filtered = userId ? expenses.filter(e => e.user_id === userId) : expenses;
    const categories = {};
    filtered.forEach(e => {
      if (!categories[e.category]) categories[e.category] = { count: 0, amount: 0 };
      categories[e.category].count++;
      categories[e.category].amount += e.amount;
    });
    return Object.entries(categories).map(([name, data]) => ({ name, ...data }));
  },
  getMonthlyTrend: (userId = null) => {
    const filtered = userId ? expenses.filter(e => e.user_id === userId) : expenses;
    const months = {};
    filtered.forEach(e => {
      const month = e.date.substring(0, 7);
      if (!months[month]) months[month] = { month, amount: 0, count: 0 };
      months[month].amount += e.amount;
      months[month].count++;
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }
};

// Small Supabase-compatible adapter so the same routes work in demo mode.
class MockQuery {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.selection = '*';
    this.operation = 'select';
    this.payload = null;
    this.isSingle = false;
    this.sort = null;
  }

  select(columns = '*') { this.selection = columns; return this; }
  eq(column, value) { this.filters.push(row => String(row[column]) === String(value)); return this; }
  gte(column, value) { this.filters.push(row => row[column] >= value); return this; }
  lte(column, value) { this.filters.push(row => row[column] <= value); return this; }
  order(column, options = {}) { this.sort = { column, ascending: options.ascending !== false }; return this; }
  insert(rows) { this.operation = 'insert'; this.payload = rows; return this; }
  update(values) { this.operation = 'update'; this.payload = values; return this; }
  delete() { this.operation = 'delete'; return this; }
  single() { this.isSingle = true; return this; }

  rows() { return this.table === 'users' ? users : expenses; }
  project(row) {
    if (this.selection === '*') return { ...row };
    return this.selection.split(',').map(column => column.trim()).reduce((result, column) => {
      if (column in row) result[column] = row[column];
      return result;
    }, {});
  }
  result(data, error = null) {
    const value = this.isSingle ? (data[0] || null) : data;
    return { data: value, error: this.isSingle && !value ? { code: 'PGRST116', message: 'No rows found' } : error };
  }
  async execute() {
    const records = this.rows();
    const matching = records.filter(row => this.filters.every(filter => filter(row)));
    if (this.operation === 'insert') {
      const created = this.payload.map(data => {
        const row = { id: this.table === 'users' ? uuidv4() : `exp-${uuidv4()}`, ...data, created_at: new Date().toISOString() };
        records.push(row);
        return this.project(row);
      });
      return this.result(created);
    }
    if (this.operation === 'update') {
      matching.forEach(row => Object.assign(row, this.payload));
      return this.result(matching.map(row => this.project(row)));
    }
    if (this.operation === 'delete') {
      const ids = new Set(matching.map(row => row.id));
      if (this.table === 'users') users = users.filter(row => !ids.has(row.id));
      else expenses = expenses.filter(row => !ids.has(row.id));
      return this.result([]);
    }
    const result = matching.map(row => this.project(row));
    if (this.sort) {
      const { column, ascending } = this.sort;
      result.sort((a, b) => (a[column] > b[column] ? 1 : a[column] < b[column] ? -1 : 0) * (ascending ? 1 : -1));
    }
    return this.result(result);
  }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
}

const createMockSupabaseClient = () => ({ from: table => new MockQuery(table) });
module.exports = { ...mockDB, createMockSupabaseClient };
