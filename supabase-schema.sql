-- Supabase SQL schema for Nepal Online Driving License Written Exam System
-- Run in Supabase SQL editor as an authenticated owner.

-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- Profiles table referencing auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name_en text not null,
  full_name_np text,
  date_of_birth date not null,
  citizenship_number text not null unique,
  permanent_address text not null,
  temporary_address text,
  contact_number text not null,
  email text not null,
  photo_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Documents table for uploads & admin status
create type document_status as enum ('pending','approved','rejected');
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('photo','citizenship')),
  file_path text not null,
  status document_status not null default 'pending',
  admin_comment text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create index if not exists documents_user_idx on public.documents(user_id);

-- Admin verifications log
create table if not exists public.admin_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  admin_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('approved','rejected')),
  comment text,
  created_at timestamp with time zone default now()
);

-- Questions bank
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  options jsonb not null,
  correct_index int not null check (correct_index between 0 and 3),
  active boolean not null default true,
  created_at timestamp with time zone default now()
);

-- Exam attempts
create table if not exists public.exam_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamp with time zone not null default now(),
  submitted_at timestamp with time zone,
  duration_minutes int not null default 60,
  total_questions int not null default 25,
  correct_answers int not null default 0,
  score int not null default 0, -- out of 100
  passed boolean not null default false,
  answers jsonb, -- [{question_id, selected_index, is_correct}]
  created_at timestamp with time zone default now()
);
create index if not exists exam_attempts_user_idx on public.exam_attempts(user_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.admin_verifications enable row level security;
alter table public.questions enable row level security;
alter table public.exam_attempts enable row level security;

-- Policies
-- Profiles: user can manage own profile; admins can read all
create policy if not exists profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy if not exists profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy if not exists profiles_update_own on public.profiles for update using (auth.uid() = id);

-- Documents: owner can insert/select own; admin can update status
create policy if not exists documents_select_own on public.documents for select using (auth.uid() = user_id);
create policy if not exists documents_insert_own on public.documents for insert with check (auth.uid() = user_id);
-- Admin role will be granted via supabase Auth policies/roles or a separate admin flag; update policy will be added later

-- Questions: public read (for exam engine), admin manage
create policy if not exists questions_select_all on public.questions for select using (true);

-- Exam attempts: user can manage own
create policy if not exists attempts_select_own on public.exam_attempts for select using (auth.uid() = user_id);
create policy if not exists attempts_insert_own on public.exam_attempts for insert with check (auth.uid() = user_id);
create policy if not exists attempts_update_own on public.exam_attempts for update using (auth.uid() = user_id);

-- Storage buckets (create via Supabase Storage UI):
-- 1) documents (public: false)
--    - folders: photo/, citizenship/
-- Set storage policies to allow users to upload/read their own files and admins read all.


