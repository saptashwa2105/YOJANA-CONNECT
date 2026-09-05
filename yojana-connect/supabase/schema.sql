-- Supabase PostgreSQL Schema for Yojana Connect
-- Run this in your Supabase SQL Editor (https://app.supabase.com)

-- 1. Create users table to store citizen profile data
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  supabase_id TEXT UNIQUE,
  email TEXT,
  age INTEGER,
  state TEXT DEFAULT 'All India',
  occupation TEXT DEFAULT 'General Citizen',
  annual_income NUMERIC,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by Supabase Auth ID
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON public.users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supabase_user_id TEXT,
  scheme_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_scheme UNIQUE(user_id, scheme_id)
);

-- Indexes for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_scheme_id ON public.bookmarks(scheme_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_supabase_user_id ON public.bookmarks(supabase_user_id);

-- 3. Row Level Security (RLS) Setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Allow public / anon and authenticated read & write (or scoped by auth.uid())
CREATE POLICY "Allow authenticated and service role full access to users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated and service role full access to bookmarks"
  ON public.bookmarks
  FOR ALL
  USING (true)
  WITH CHECK (true);

