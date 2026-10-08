# 💸 ExpenseFlow — Business Expense Reimbursement System

> **AIML A9 Hackathon Project** | Team: Bhavesh Kumar, Anuraag Subramanya K S, Basanagouda Govindagouda B Patil, Chinmay Amit Musale

A full-stack digital workflow for employees to **submit**, **track**, and **manage** business expense reimbursements — with real-time dashboards, analytics, and manager approvals.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔐 Multi-Role Auth | Employee / Manager / Admin with JWT |
| 📝 Expense Submission | Form with category, amount, receipt upload |
| ✅ Manager Approval | Review, approve, reject with comments |
| 📊 Dashboard | Real-time stats & interactive charts |
| 📈 Reports | Category breakdown & monthly trend analytics |
| 📁 Export | CSV export + Print-to-PDF reports |
| 👥 User Management | Admin can create/delete users |
| 🌙 Dark Mode | Premium glassmorphism design |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm

### Installation
```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 👤 Employee | `employee@demo.com` | `password123` |
| 👔 Manager | `manager@demo.com` | `password123` |
| 🛡️ Admin | `admin@demo.com` | `password123` |

---

## 🗂️ Project Structure

```
h.1/
├── server/
│   ├── index.js              # Express server entry
│   ├── config/
│   │   ├── supabase.js       # Supabase client
│   │   └── mockDB.js         # In-memory demo database
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   └── routes/
│       ├── auth.js           # Login / Register
│       ├── expenses.js       # Expense CRUD + review
│       └── users.js          # User management
├── public/
│   ├── index.html            # SPA frontend
│   ├── style.css             # Premium dark CSS
│   └── app.js                # Frontend JavaScript
├── .env                      # Configuration
└── package.json
```

---

## 🔧 Supabase Setup (Optional)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your Project URL and API keys to `.env`
3. Run the SQL schema (coming soon)

By default, the app uses an **in-memory mock database** with pre-seeded demo data.
To connect to Supabase instead, set `USE_MOCK_DB=false` in `.env` after running the schema.

---

## 🏆 Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** Supabase (PostgreSQL) / In-memory mock
- **Auth:** JWT (JSON Web Tokens)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Charts:** Chart.js
- **Design:** Custom dark glassmorphism system

---

*Built for AIML A9 Hackathon 2024*
