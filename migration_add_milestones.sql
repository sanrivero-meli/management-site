-- Migration: Add project_milestones table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    color TEXT DEFAULT '#ef4444',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX idx_project_milestones_date ON public.project_milestones(date);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users" ON public.project_milestones
    FOR ALL USING (auth.role() = 'authenticated');
