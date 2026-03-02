-- Migration: Add todos and todo_categories tables
-- Run this SQL in your Supabase SQL Editor

-- Todo categories table
CREATE TABLE IF NOT EXISTS public.todo_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date DATE,
  category_id UUID REFERENCES public.todo_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_category_id ON public.todos(category_id);
CREATE INDEX idx_todos_completed ON public.todos(completed);
CREATE INDEX idx_todos_priority ON public.todos(priority);
CREATE INDEX idx_todos_due_date ON public.todos(due_date);
CREATE INDEX idx_todo_categories_user_id ON public.todo_categories(user_id);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own todos" ON public.todos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON public.todo_categories
  FOR ALL USING (auth.uid() = user_id);
