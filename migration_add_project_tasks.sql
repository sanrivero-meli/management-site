-- Migration: Add project_tasks table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    deliverables TEXT,
    start_date DATE,
    end_date DATE,
    owner_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Not Started' 
      CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Complete')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_project_tasks_updated_at 
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_owner_id ON public.project_tasks(owner_id);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users" ON public.project_tasks
    FOR ALL USING (auth.role() = 'authenticated');
