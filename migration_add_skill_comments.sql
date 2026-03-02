-- Migration: Add skill_comments column to skills table
-- This allows storing contextual comments for each skill rating

ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS skill_comments JSONB;

-- Add comment to document the column
COMMENT ON COLUMN public.skills.skill_comments IS 'Stores comments for each skill as JSONB object with skill keys as properties (e.g., {"pensamiento_critico": "comment text", "vision_sistemica": "comment text"})';
