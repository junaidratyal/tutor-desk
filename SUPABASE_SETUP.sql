-- =============================================
-- TUTOR DESK - Supabase Database Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Students table
create table if not exists students (
  id uuid default uuid_generate_v4() primary key,
  tutor_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  parent_name text not null,
  phone text not null,
  subject text not null,
  monthly_fee integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Sessions table
create table if not exists sessions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references students(id) on delete cascade not null,
  date date not null,
  time time not null,
  duration integer not null default 60,
  status text not null default 'scheduled' check (status in ('scheduled','done','cancelled')),
  created_at timestamp with time zone default now()
);

-- Payments table
create table if not exists payments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references students(id) on delete cascade not null,
  month integer not null,
  year integer not null,
  amount integer not null,
  status text not null default 'unpaid' check (status in ('paid','unpaid')),
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(student_id, month, year)
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

alter table students enable row level security;
alter table sessions enable row level security;
alter table payments enable row level security;

-- Students: tutor can only see/edit their own students
create policy "Tutors manage own students" on students
  for all using (auth.uid() = tutor_id);

-- Sessions: tutor can see sessions of their students
create policy "Tutors manage own sessions" on sessions
  for all using (
    student_id in (select id from students where tutor_id = auth.uid())
  );

-- Payments: tutor can see payments of their students
create policy "Tutors manage own payments" on payments
  for all using (
    student_id in (select id from students where tutor_id = auth.uid())
  );

-- =============================================
-- Done! Your Tutor Desk database is ready ✅
-- =============================================
