/* ================================================================
   ExpenseFlow — Frontend Application
   ================================================================ */

const API_BASE = (window.location.hostname === 'localhost' && window.location.port !== '3000') || (window.location.hostname === '127.0.0.1' && window.location.port !== '3000') || window.location.protocol === 'file:'
  ? 'http://localhost:3000/api'
  : '/api';
let currentUser = null;
let authToken = null;
let currentReviewExpenseId = null;
let categoryChartInstance = null;
let trendChartInstance = null;
let reportCategoryChartInstance = null;
let reportTrendChartInstance = null;

// ================================================================
// UTILS
// ================================================================

const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const statusBadge = (status) => {
  const icons = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌'
  };
  return `<span class="badge badge-${status}">${icons[status] || ''} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
};

const roleBadge = (role) => {
  return `<span class="role-badge role-${role}">${role}</span>`;
};

const toast = (message, type = 'info') => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('hide');
    setTimeout(() => t.remove(), 300);
  }, 3500);
};

const setLoading = (btnId, loading) => {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span style="opacity:0.7">Loading...</span>';
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
  }
};

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error('Cannot reach server. Make sure the Node server is running on http://localhost:3000');
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(
      response.status === 404
        ? 'Endpoint not found. Please access the application at http://localhost:3000'
        : (text.slice(0, 120) || 'Server returned non-JSON response')
    );
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

async function apiFormRequest(endpoint, formData) {
  const url = `${API_BASE}${endpoint}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
  } catch (err) {
    throw new Error('Cannot reach server. Make sure the Node server is running on http://localhost:3000');
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(text.slice(0, 120) || 'Server returned non-JSON response');
  }

  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ================================================================
// AUTH
// ================================================================

function switchAuthTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

function fillDemo(email) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = 'password123';
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');

  setLoading('login-btn', true);
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('ers_token', authToken);
    localStorage.setItem('ers_user', JSON.stringify(currentUser));
    initApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    setLoading('login-btn', false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const errorEl = document.getElementById('register-error');
  errorEl.classList.add('hidden');

  setLoading('register-btn', true);
  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        department: document.getElementById('reg-department').value,
        role: document.getElementById('reg-role').value
      })
    });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('ers_token', authToken);
    localStorage.setItem('ers_user', JSON.stringify(currentUser));
    toast('Account created successfully!', 'success');
    initApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    setLoading('register-btn', false);
  }
}

function handleLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('ers_token');
  localStorage.removeItem('ers_user');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  toast('Logged out successfully', 'info');
}

// ================================================================
// APP INIT
// ================================================================

function initApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Update UI with user info
  const user = currentUser;
  document.getElementById('sidebar-avatar').textContent = user.avatar;
  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-role').textContent = user.role;
  document.getElementById('topbar-avatar').textContent = user.avatar;
  document.getElementById('topbar-name').textContent = user.name;

  // Show/hide manager and admin sections
  const managerSection = document.getElementById('nav-manager-section');
  const adminSection = document.getElementById('nav-admin-section');

  if (user.role === 'employee') {
    managerSection.style.display = 'none';
    adminSection.style.display = 'none';
  } else if (user.role === 'manager') {
    managerSection.style.display = '';
    adminSection.style.display = 'none';
  } else {
    managerSection.style.display = '';
    adminSection.style.display = '';
  }

  // Set today's date as default for expense form
  document.getElementById('exp-date').valueAsDate = new Date();

  // Init chart defaults
  initChartDefaults();

  // Update approval badge
  updateApprovalBadge();

  navigateTo('dashboard');
}

async function updateApprovalBadge() {
  if (currentUser.role === 'employee') return;
  try {
    const data = await apiRequest('/expenses/pending');
    const badge = document.getElementById('approval-badge');
    badge.textContent = data.total;
    badge.style.display = data.total > 0 ? '' : 'none';
  } catch (e) {
    // ignore
  }
}

// ================================================================
// NAVIGATION
// ================================================================

const PAGE_META = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your expense activity' },
  submit: { title: 'Submit Expense', subtitle: 'Request reimbursement for business expenses' },
  myexpenses: { title: 'My Expenses', subtitle: 'Track all your submitted expenses' },
  approvals: { title: 'Pending Approvals', subtitle: 'Review and action employee expense requests' },
  allexpenses: { title: 'All Expenses', subtitle: 'View and manage all company expenses' },
  users: { title: 'User Management', subtitle: 'Manage employee accounts and roles' },
  reports: { title: 'Reports & Analytics', subtitle: 'Insights into company spending patterns' }
};

function navigateTo(page) {
  // Remove hidden class from all views (initial HTML has them hidden), then hide via active
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.remove('hidden'); // BUGFIX: initial views have class="view hidden"
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target view
  const view = document.getElementById(`view-${page}`);
  if (view) view.classList.add('active');

  const navItem = document.getElementById(`nav-${page}`);
  if (navItem) navItem.classList.add('active');

  // Update page title
  const meta = PAGE_META[page] || {};
  document.getElementById('page-title').textContent = meta.title || page;
  document.getElementById('page-subtitle').textContent = meta.subtitle || '';

  // Load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'myexpenses': loadMyExpenses(); break;
    case 'approvals': loadApprovals(); break;
    case 'allexpenses': loadAllExpenses(); break;
    case 'users': loadUsers(); break;
    case 'reports': loadReports(); break;
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('hidden');
}

// ================================================================
// DASHBOARD
// ================================================================

async function loadDashboard() {
  try {
    const [statsData, expensesData] = await Promise.all([
      apiRequest('/expenses/stats'),
      apiRequest('/expenses?limit=5')
    ]);

    const { stats, byCategory, monthlyTrend } = statsData;

    // Stats cards
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-total-amount').textContent = formatCurrency(stats.total_amount);
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-pending-amount').textContent = formatCurrency(stats.pending_amount);
    document.getElementById('stat-approved').textContent = stats.approved;
    document.getElementById('stat-approved-amount').textContent = formatCurrency(stats.approved_amount);
    document.getElementById('stat-rejected').textContent = stats.rejected;
    document.getElementById('stat-rejected-count').textContent = `out of ${stats.total} total`;

    // Remove shimmer
    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('loading-shimmer'));

    // Charts
    renderCategoryChart('categoryChart', byCategory);
    renderTrendChart('trendChart', monthlyTrend);

    // Recent expenses table
    const recent = expensesData.expenses.slice(0, 5);
    renderExpensesTable('recent-expenses-table', recent, { compact: true });

  } catch (err) {
    toast('Failed to load dashboard data', 'error');
    console.error(err);
  }
}

// ================================================================
// CHARTS
// ================================================================

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
  '#f97316', '#a78bfa'
];

function initChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
}

function renderCategoryChart(canvasId, data) {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const existing = canvasId === 'categoryChart' ? categoryChartInstance : reportCategoryChartInstance;
  if (existing) existing.destroy();

  if (!data || !data.length) return;

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.name),
      datasets: [{
        data: data.map(d => d.amount),
        backgroundColor: CHART_COLORS.slice(0, data.length),
        borderColor: 'transparent',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 10,
            padding: 12,
            font: { size: 12, family: 'Inter' }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatCurrency(ctx.raw)}`
          }
        }
      }
    }
  });

  if (canvasId === 'categoryChart') categoryChartInstance = chart;
  else if (canvasId === 'reportCategoryChart') reportCategoryChartInstance = chart;
}

function renderTrendChart(canvasId, data) {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const existing = canvasId === 'trendChart' ? trendChartInstance : reportTrendChartInstance;
  if (existing) existing.destroy();

  if (!data || !data.length) return;

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map(d => {
        const [y, m] = d.month.split('-');
        return new Date(y, parseInt(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }),
      datasets: [{
        label: 'Total Expenses',
        data: data.map(d => d.amount),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, family: 'Inter' } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            font: { size: 11, family: 'Inter' },
            callback: (val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`
          }
        }
      }
    }
  });

  if (canvasId === 'trendChart') trendChartInstance = chart;
  else if (canvasId === 'reportTrendChart') reportTrendChartInstance = chart;
}

// ================================================================
// EXPENSE TABLE RENDERER
// ================================================================

function renderExpensesTable(containerId, expenses, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!expenses || expenses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <h4>No expenses found</h4>
        <p>Submit your first expense to get started</p>
      </div>`;
    return;
  }

  const showEmployee = currentUser.role !== 'employee';
  const showActions = !options.compact;

  let html = `<div class="table-wrapper"><table>
    <thead><tr>
      ${showEmployee ? '<th>Employee</th>' : ''}
      <th>Title</th>
      <th>Category</th>
      <th>Amount</th>
      <th>Date</th>
      <th>Status</th>
      ${showActions ? '<th>Actions</th>' : ''}
    </tr></thead>
    <tbody>`;

  for (const exp of expenses) {
    const canDelete = currentUser.role !== 'employee' ||
      (exp.user_id === currentUser.id && exp.status === 'pending');

    html += `<tr>
      ${showEmployee ? `<td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="user-avatar sm" style="font-size:10px;">${(exp.user_name || 'U').split(' ').map(n=>n[0]).join('').substring(0,2)}</div>
          <span>${exp.user_name || '—'}</span>
        </div>
      </td>` : ''}
      <td>
        <div style="font-weight:600;color:var(--text-primary);">${exp.title}</div>
        ${exp.description ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${exp.description.substring(0, 50)}${exp.description.length > 50 ? '...' : ''}</div>` : ''}
      </td>
      <td><span style="font-size:12px;background:var(--bg-elevated);padding:3px 8px;border-radius:6px;color:var(--text-secondary);">${exp.category}</span></td>
      <td class="amount-cell">${formatCurrency(exp.amount, exp.currency)}</td>
      <td>${formatDate(exp.date)}</td>
      <td>${statusBadge(exp.status)}</td>
      ${showActions ? `<td>
        <div class="action-btns">
          <button class="icon-btn" onclick="viewExpenseDetails('${exp.id}')" title="View Details">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${(currentUser.role === 'manager' || currentUser.role === 'admin') && exp.status === 'pending' ? `
            <button class="icon-btn approve" onclick="openReviewModal('${exp.id}')" title="Review">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </button>
          ` : ''}
          ${canDelete ? `
            <button class="icon-btn delete" onclick="deleteExpense('${exp.id}')" title="Delete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          ` : ''}
        </div>
      </td>` : ''}
    </tr>`;
  }

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ================================================================
// MY EXPENSES
// ================================================================

async function loadMyExpenses() {
  const status = document.getElementById('filter-status-my')?.value || '';
  const search = document.getElementById('search-my')?.value || '';

  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const data = await apiRequest(`/expenses?${params}`);
    renderExpensesTable('my-expenses-table', data.expenses, { showActions: true });
  } catch (err) {
    toast('Failed to load expenses', 'error');
  }
}

// ================================================================
// APPROVALS
// ================================================================

async function loadApprovals() {
  const search = document.getElementById('search-approvals')?.value || '';

  try {
    let data = await apiRequest('/expenses/pending');
    let expenses = data.expenses;

    if (search) {
      const q = search.toLowerCase();
      expenses = expenses.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.user_name?.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }

    renderExpensesTable('approvals-table', expenses, { showActions: true });
    updateApprovalBadge();
  } catch (err) {
    toast('Failed to load approvals', 'error');
  }
}

// ================================================================
// ALL EXPENSES
// ================================================================

async function loadAllExpenses() {
  const status = document.getElementById('filter-status-all')?.value || '';
  const category = document.getElementById('filter-category-all')?.value || '';
  const search = document.getElementById('search-all')?.value || '';

  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const data = await apiRequest(`/expenses?${params}`);
    renderExpensesTable('all-expenses-table', data.expenses, { showActions: true });
  } catch (err) {
    toast('Failed to load expenses', 'error');
  }
}

// ================================================================
// SUBMIT EXPENSE
// ================================================================

function handleFileSelect(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('file-preview');
  if (file) {
    preview.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
}

function resetExpenseForm() {
  document.getElementById('expense-form').reset();
  document.getElementById('exp-date').valueAsDate = new Date();
  document.getElementById('file-preview').classList.add('hidden');
}

async function handleSubmitExpense(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('title', document.getElementById('exp-title').value);
  formData.append('amount', document.getElementById('exp-amount').value);
  formData.append('currency', 'INR');
  formData.append('category', document.getElementById('exp-category').value);
  formData.append('date', document.getElementById('exp-date').value);
  formData.append('description', document.getElementById('exp-description').value);

  const receiptFile = document.getElementById('exp-receipt').files[0];
  if (receiptFile) formData.append('receipt', receiptFile);

  setLoading('submit-expense-btn', true);
  try {
    await apiFormRequest('/expenses', formData);
    toast('Expense submitted successfully! 🎉', 'success');
    resetExpenseForm();
    updateApprovalBadge();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setLoading('submit-expense-btn', false);
  }
}

// ================================================================
// REVIEW EXPENSE
// ================================================================

async function openReviewModal(expenseId) {
  currentReviewExpenseId = expenseId;
  try {
    const data = await apiRequest(`/expenses/${expenseId}`);
    const exp = data.expense;

    document.getElementById('review-modal-body').innerHTML = `
      <div class="expense-detail-grid">
        <div class="detail-item">
          <span class="detail-label">Title</span>
          <span class="detail-value">${exp.title}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Submitted By</span>
          <span class="detail-value">${exp.user_name || '—'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Amount</span>
          <span class="detail-value amount">${formatCurrency(exp.amount, exp.currency)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Category</span>
          <span class="detail-value">${exp.category}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Date</span>
          <span class="detail-value">${formatDate(exp.date)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Submitted On</span>
          <span class="detail-value">${formatDateTime(exp.created_at)}</span>
        </div>
      </div>
      ${exp.description ? `
        <div class="detail-item">
          <span class="detail-label">Description</span>
          <span class="detail-value" style="color:var(--text-secondary);">${exp.description}</span>
        </div>` : ''}
    `;
    document.getElementById('review-comment').value = '';
    document.getElementById('review-modal').classList.remove('hidden');
  } catch (err) {
    toast('Failed to load expense details', 'error');
  }
}

async function reviewExpense(status) {
  if (!currentReviewExpenseId) return;

  const comment = document.getElementById('review-comment').value;

  try {
    await apiRequest(`/expenses/${currentReviewExpenseId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, manager_comment: comment })
    });
    toast(`Expense ${status} successfully!`, status === 'approved' ? 'success' : 'warning');
    closeModal('review-modal');
    loadApprovals();
    updateApprovalBadge();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ================================================================
// VIEW EXPENSE DETAILS
// ================================================================

async function viewExpenseDetails(expenseId) {
  try {
    const data = await apiRequest(`/expenses/${expenseId}`);
    const exp = data.expense;

    document.getElementById('view-expense-modal-body').innerHTML = `
      <div class="expense-detail-grid">
        <div class="detail-item">
          <span class="detail-label">Title</span>
          <span class="detail-value">${exp.title}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="detail-value">${statusBadge(exp.status)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Amount</span>
          <span class="detail-value amount">${formatCurrency(exp.amount, exp.currency)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Category</span>
          <span class="detail-value">${exp.category}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Expense Date</span>
          <span class="detail-value">${formatDate(exp.date)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Submitted On</span>
          <span class="detail-value">${formatDateTime(exp.created_at)}</span>
        </div>
        ${exp.user_name ? `
        <div class="detail-item">
          <span class="detail-label">Submitted By</span>
          <span class="detail-value">${exp.user_name}</span>
        </div>` : ''}
        ${exp.reviewed_at ? `
        <div class="detail-item">
          <span class="detail-label">Reviewed On</span>
          <span class="detail-value">${formatDateTime(exp.reviewed_at)}</span>
        </div>` : ''}
      </div>
      ${exp.description ? `
        <div class="detail-item">
          <span class="detail-label">Description</span>
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;padding:12px;background:var(--bg-elevated);border-radius:var(--radius-sm);margin-top:4px;">${exp.description}</p>
        </div>` : ''}
      ${exp.manager_comment ? `
        <div style="padding:12px 16px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:var(--radius);margin-top:4px;">
          <span style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">💬 Manager Comment</span>
          <p style="color:var(--text-secondary);font-size:14px;">${exp.manager_comment}</p>
        </div>` : ''}
    `;
    document.getElementById('view-expense-modal').classList.remove('hidden');
  } catch (err) {
    toast('Failed to load expense details', 'error');
  }
}

// ================================================================
// DELETE EXPENSE
// ================================================================

async function deleteExpense(expenseId) {
  if (!confirm('Are you sure you want to delete this expense?')) return;

  try {
    await apiRequest(`/expenses/${expenseId}`, { method: 'DELETE' });
    toast('Expense deleted successfully', 'info');
    loadMyExpenses();
    if (currentUser.role !== 'employee') loadAllExpenses();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ================================================================
// USERS
// ================================================================

async function loadUsers() {
  try {
    const data = await apiRequest('/users');
    const container = document.getElementById('users-table');

    if (!data.users || !data.users.length) {
      container.innerHTML = '<div class="empty-state"><h4>No users found</h4></div>';
      return;
    }

    let html = `<div class="table-wrapper"><table>
      <thead><tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Department</th>
        <th>Joined</th>
        <th>Actions</th>
      </tr></thead>
      <tbody>`;

    for (const user of data.users) {
      html += `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="user-avatar sm">${user.avatar || 'U'}</div>
            <span style="font-weight:600;color:var(--text-primary);">${user.name}</span>
          </div>
        </td>
        <td>${user.email}</td>
        <td>${roleBadge(user.role)}</td>
        <td>${user.department || '—'}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <div class="action-btns">
            ${user.id !== currentUser.id ? `
              <button class="icon-btn delete" onclick="deleteUser('${user.id}', '${user.name}')" title="Delete User">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            ` : '<span style="font-size:12px;color:var(--text-muted);">You</span>'}
          </div>
        </td>
      </tr>`;
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (err) {
    toast('Failed to load users', 'error');
  }
}

function openAddUserModal() {
  document.getElementById('add-user-modal').classList.remove('hidden');
}

async function handleAddUser(e) {
  e.preventDefault();
  try {
    await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('new-user-name').value,
        email: document.getElementById('new-user-email').value,
        role: document.getElementById('new-user-role').value,
        department: document.getElementById('new-user-dept').value,
        password: document.getElementById('new-user-password').value
      })
    });
    toast('User created successfully!', 'success');
    closeModal('add-user-modal');
    e.target.reset();
    loadUsers();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;

  try {
    await apiRequest(`/users/${userId}`, { method: 'DELETE' });
    toast(`User "${userName}" deleted`, 'info');
    loadUsers();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ================================================================
// REPORTS
// ================================================================

async function loadReports() {
  try {
    const data = await apiRequest('/expenses/stats');
    const { stats, byCategory, monthlyTrend } = data;

    // Summary cards
    document.getElementById('reports-summary').innerHTML = `
      <div class="summary-card">
        <div class="summary-value">${formatCurrency(stats.total_amount)}</div>
        <div class="summary-label">Total Expense Value</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${formatCurrency(stats.approved_amount)}</div>
        <div class="summary-label">Total Approved</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${formatCurrency(stats.pending_amount)}</div>
        <div class="summary-label">Pending Reimbursement</div>
      </div>
    `;

    // Charts
    renderCategoryChart('reportCategoryChart', byCategory);
    renderTrendChart('reportTrendChart', monthlyTrend);

    // Category breakdown table
    const maxAmount = Math.max(...byCategory.map(c => c.amount));
    const tableHtml = `
      <div style="padding:8px 0;">
        ${byCategory.map(cat => `
          <div class="cat-breakdown-row">
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div>
                  <span class="cat-name">${cat.name}</span>
                  <span class="cat-count" style="margin-left:8px;">${cat.count} expense${cat.count !== 1 ? 's' : ''}</span>
                </div>
                <span class="cat-amount">${formatCurrency(cat.amount)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width:${((cat.amount / maxAmount) * 100).toFixed(1)}%"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    document.getElementById('category-breakdown-table').innerHTML = tableHtml;

  } catch (err) {
    toast('Failed to load reports', 'error');
  }
}

// ================================================================
// EXPORT
// ================================================================

async function exportExpenses(type) {
  try {
    const data = await apiRequest(type === 'my' ? '/expenses' : '/expenses');
    const expenses = data.expenses;

    const headers = ['ID', 'Title', 'Category', 'Amount', 'Currency', 'Date', 'Status', 'Description', 'Submitted By', 'Submitted On', 'Manager Comment'];
    const rows = expenses.map(exp => [
      exp.id,
      `"${exp.title}"`,
      exp.category,
      exp.amount,
      exp.currency || 'INR',
      exp.date,
      exp.status,
      `"${exp.description || ''}"`,
      `"${exp.user_name || ''}"`,
      exp.created_at,
      `"${exp.manager_comment || ''}"`
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast('CSV exported successfully!', 'success');
  } catch (err) {
    toast('Failed to export', 'error');
  }
}

async function exportPDF() {
  try {
    const data = await apiRequest('/expenses/stats');
    const { stats, byCategory } = data;

    const expData = await apiRequest('/expenses');
    const expenses = expData.expenses;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Expense Report — ExpenseFlow</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #333; padding: 40px; font-size: 13px; }
    h1 { font-size: 24px; color: #4f46e5; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 30px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .stat { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
    .stat .val { font-size: 20px; font-weight: 700; color: #111; }
    .stat .lbl { font-size: 11px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .badge { padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 600; }
    .badge-approved { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 40px; text-align: center; color: #888; font-size: 11px; }
  </style>
</head>
<body>
  <h1>ExpenseFlow — Expense Report</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  
  <div class="stats">
    <div class="stat"><div class="val">${stats.total}</div><div class="lbl">Total Submitted</div></div>
    <div class="stat"><div class="val">${stats.approved}</div><div class="lbl">Approved</div></div>
    <div class="stat"><div class="val">${stats.pending}</div><div class="lbl">Pending</div></div>
    <div class="stat"><div class="val">₹${stats.total_amount.toLocaleString('en-IN')}</div><div class="lbl">Total Value</div></div>
  </div>

  <h3 style="margin-bottom:12px;color:#4f46e5;">Expense Details</h3>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Submitted By</th>
        <th>Category</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(exp => `
        <tr>
          <td>${exp.title}</td>
          <td>${exp.user_name || '—'}</td>
          <td>${exp.category}</td>
          <td>₹${exp.amount.toLocaleString('en-IN')}</td>
          <td>${new Date(exp.date).toLocaleDateString('en-IN')}</td>
          <td><span class="badge badge-${exp.status}">${exp.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">ExpenseFlow — Business Expense Reimbursement System • Generated by ${currentUser.name}</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();

    toast('PDF report opened for printing!', 'success');
  } catch (err) {
    toast('Failed to generate PDF', 'error');
  }
}

// ================================================================
// MODALS
// ================================================================

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  currentReviewExpenseId = null;
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function (e) {
    if (e.target === this) {
      this.classList.add('hidden');
      currentReviewExpenseId = null;
    }
  });
});

// ================================================================
// INIT ON LOAD
// ================================================================

window.addEventListener('DOMContentLoaded', () => {
  // Try auto-login from localStorage
  const savedToken = localStorage.getItem('ers_token');
  const savedUser = localStorage.getItem('ers_user');

  if (savedToken && savedUser) {
    authToken = savedToken;
    currentUser = JSON.parse(savedUser);
    // Verify token is still valid
    apiRequest('/auth/me')
      .then(() => initApp())
      .catch(() => {
        localStorage.removeItem('ers_token');
        localStorage.removeItem('ers_user');
      });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      currentReviewExpenseId = null;
    }
  });
});
