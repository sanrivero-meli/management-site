-- Migration: Add new project fields and update status options
-- Run this SQL in your Supabase SQL Editor

-- Add new columns for project metadata
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS squad TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owners JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS product_owner TEXT;

-- Add check constraints for new columns
ALTER TABLE public.projects ADD CONSTRAINT projects_priority_check 
  CHECK (priority IS NULL OR priority IN ('HIT', 'Carryover', 'BAU', 'World Class', 'Wishlist', 'Quality'));

ALTER TABLE public.projects ADD CONSTRAINT projects_category_check 
  CHECK (category IS NULL OR category IN ('Legal', 'Delivery', 'Research', 'Support'));

ALTER TABLE public.projects ADD CONSTRAINT projects_squad_check 
  CHECK (squad IS NULL OR squad IN ('Long Term', 'Short Term', 'Backoffice', 'Cross'));

-- Migrate existing status values to new values before updating constraint
UPDATE public.projects SET status = 'Doing' WHERE status = 'Active';
UPDATE public.projects SET status = 'Paused' WHERE status = 'On Hold';
UPDATE public.projects SET status = 'Done' WHERE status = 'Complete';

-- Update status constraint (drop old, add new)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('Planning', 'To Do', 'Doing', 'Paused', 'Done', 'Cancelled'));

-- Create indexes for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_squad ON public.projects(squad);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_projects_owners ON public.projects USING GIN (owners);
