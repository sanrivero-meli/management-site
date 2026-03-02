-- Migration: Add start_date, end_date, and estimated fields to projects table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS estimated NUMERIC(10, 2);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON public.projects(end_date);
