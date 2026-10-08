-- ================================================================
-- ExpenseFlow — Fix: Add missing 'avatar' column + Full Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================================
-- Drop and recreate tables cleanly (or use ALTER TABLE below)
-- ================================================================

-- If tables already exist without avatar, run this first:
alter table if exists public.users add column if not exists avatar text;

-- ================================================================
-- Create tables if they don't exist yet
-- ================================================================
create table if not exists public.users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text unique not null,
  password    text not null,
  role        text not null default 'employee' check (role in ('employee', 'manager', 'admin')),
  department  text not null default 'General',
  avatar      text,
  created_at  timestamptz default now()
);

create table if not exists public.expenses (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references public.users(id) on delete cascade,
  user_name        text,
  title            text not null,
  amount           numeric(12, 2) not null,
  currency         text not null default 'INR',
  category         text not null,
  date             date not null,
  description      text,
  receipt_url      text,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  manager_comment  text,
  reviewed_by      uuid references public.users(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz default now()
);

-- ================================================================
-- DISABLE Row Level Security (auth handled by Express JWT)
-- ================================================================
alter table public.users disable row level security;
alter table public.expenses disable row level security;

-- ================================================================
-- SEED DATA — Demo Users (all passwords = "password123")
-- ================================================================
insert into public.users (id, name, email, password, role, department, avatar) values
  ('00000000-0000-0000-0000-000000000001', 'John Employee',   'employee@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 'Engineering', 'JE'),
  ('00000000-0000-0000-0000-000000000002', 'Sarah Manager',   'manager@demo.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager',  'Engineering', 'SM'),
  ('00000000-0000-0000-0000-000000000003', 'Admin User',      'admin@demo.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin',    'HR',          'AU'),
  ('00000000-0000-0000-0000-000000000004', 'Alice Developer', 'alice@demo.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 'Engineering', 'AD'),
  ('00000000-0000-0000-0000-000000000005', 'Bob Marketing',   'bob@demo.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 'Marketing',   'BM')
on conflict (email) do nothing;

-- ================================================================
-- SEED DATA — Demo Expenses
-- ================================================================
insert into public.expenses (user_id, user_name, title, amount, currency, category, date, description, status, manager_comment, reviewed_by, reviewed_at) values
  ('00000000-0000-0000-0000-000000000001', 'John Employee',   'Client Lunch Meeting',             2500,  'INR', 'Food & Dining',        '2024-10-01', 'Lunch with potential client at The Grand Hotel',      'approved', 'Approved. Good client engagement.',    '00000000-0000-0000-0000-000000000002', now()),
  ('00000000-0000-0000-0000-000000000001', 'John Employee',   'Travel to Bangalore Conference',   8500,  'INR', 'Travel',               '2024-10-05', 'Round trip flight to TechConf 2024 in Bangalore',    'pending',  null, null, null),
  ('00000000-0000-0000-0000-000000000001', 'John Employee',   'Office Supplies',                  1200,  'INR', 'Office Supplies',      '2024-09-28', 'Notebooks, pens, and printer cartridges',            'rejected', 'Please use company-provided supplies.','00000000-0000-0000-0000-000000000002', now()),
  ('00000000-0000-0000-0000-000000000004', 'Alice Developer', 'AWS Course Subscription',          4999,  'INR', 'Training & Education', '2024-10-02', 'AWS Solutions Architect certification course',        'pending',  null, null, null),
  ('00000000-0000-0000-0000-000000000005', 'Bob Marketing',   'Social Media Ads Budget',          15000, 'INR', 'Marketing',            '2024-10-03', 'Q4 social media advertising campaign',               'approved', 'Approved for Q4 campaign.',            '00000000-0000-0000-0000-000000000002', now()),
  ('00000000-0000-0000-0000-000000000004', 'Alice Developer', 'Team Dinner - Sprint Celebration', 6800,  'INR', 'Food & Dining',        '2024-09-30', 'Team dinner to celebrate successful sprint delivery', 'approved', 'Great team performance!',              '00000000-0000-0000-0000-000000000002', now()),
  ('00000000-0000-0000-0000-000000000001', 'John Employee',   'Uber rides for client visits',     890,   'INR', 'Transportation',       '2024-10-06', 'Multiple Uber rides for client site visits',          'pending',  null, null, null),
  ('00000000-0000-0000-0000-000000000005', 'Bob Marketing',   'Design Software License',          3500,  'INR', 'Software & Tools',     '2024-10-04', 'Annual Figma subscription for design work',           'pending',  null, null, null)
on conflict do nothing;
