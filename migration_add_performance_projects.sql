-- Migration: Add member_performance_projects table
-- Run this SQL in your Supabase SQL Editor

-- Table: member_performance_projects
CREATE TABLE IF NOT EXISTS public.member_performance_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'On Hold', 'Complete', 'Cancelled')),
    related_skills JSONB DEFAULT '[]'::jsonb,
    comments TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_member_performance_projects_team_member_id ON public.member_performance_projects(team_member_id);
CREATE INDEX IF NOT EXISTS idx_member_performance_projects_status ON public.member_performance_projects(status);
CREATE INDEX IF NOT EXISTS idx_member_performance_projects_start_date ON public.member_performance_projects(start_date);

-- Create trigger for updated_at
CREATE TRIGGER update_member_performance_projects_updated_at BEFORE UPDATE ON public.member_performance_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.member_performance_projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.member_performance_projects
    FOR ALL USING (auth.role() = 'authenticated');
