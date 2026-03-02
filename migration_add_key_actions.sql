-- Quick Migration: Add missing key_actions, kpis, and related_skills columns to goals table
-- Run this SQL in your Supabase SQL Editor to fix the schema cache error
-- This is a safe migration that only adds columns if they don't exist

-- Add the missing columns with default values
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS key_actions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS related_skills JSONB DEFAULT '[]'::jsonb;

-- Update any existing rows that might have NULL values
UPDATE public.goals 
SET 
  key_actions = COALESCE(key_actions, '[]'::jsonb),
  kpis = COALESCE(kpis, '[]'::jsonb),
  related_skills = COALESCE(related_skills, '[]'::jsonb)
WHERE key_actions IS NULL OR kpis IS NULL OR related_skills IS NULL;

-- Create index for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_goals_related_skills ON public.goals USING GIN (related_skills);

-- Note: After running this, refresh your Supabase dashboard or wait a few seconds
-- for the schema cache to update automatically
