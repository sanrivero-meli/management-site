-- Migration: Update goals table structure
-- Run this SQL in your Supabase SQL Editor to update the goals table
-- This removes SMART fields and adds new fields: key_actions, kpis, related_skills
-- 
-- IMPORTANT: This migration will remove existing SMART field data.
-- If you have important data in specific, measurable, achievable, relevant, time_bound, or notes,
-- back it up before running this migration.

-- Step 1: Add new fields first (with defaults)
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS key_actions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS related_skills JSONB DEFAULT '[]'::jsonb;

-- Step 2: Update existing rows to have empty arrays instead of null
UPDATE public.goals 
SET 
  key_actions = COALESCE(key_actions, '[]'::jsonb),
  kpis = COALESCE(kpis, '[]'::jsonb),
  related_skills = COALESCE(related_skills, '[]'::jsonb)
WHERE key_actions IS NULL OR kpis IS NULL OR related_skills IS NULL;

-- Step 3: Remove old SMART fields (only after new fields are added and working)
ALTER TABLE public.goals DROP COLUMN IF EXISTS specific;
ALTER TABLE public.goals DROP COLUMN IF EXISTS measurable;
ALTER TABLE public.goals DROP COLUMN IF EXISTS achievable;
ALTER TABLE public.goals DROP COLUMN IF EXISTS relevant;
ALTER TABLE public.goals DROP COLUMN IF EXISTS time_bound;
ALTER TABLE public.goals DROP COLUMN IF EXISTS notes;

-- Step 4: Create index for related_skills for better query performance
CREATE INDEX IF NOT EXISTS idx_goals_related_skills ON public.goals USING GIN (related_skills);

-- Step 5: Refresh the schema cache (Supabase will do this automatically, but you can verify)
-- You may need to refresh your Supabase dashboard or wait a few seconds for the cache to update
