-- Migration: Update feedback table structure
-- Split content into highlights and improvements fields
-- Add skill selection arrays for each field

-- Step 1: Add new columns
ALTER TABLE public.feedback 
  ADD COLUMN IF NOT EXISTS highlights TEXT,
  ADD COLUMN IF NOT EXISTS improvements TEXT,
  ADD COLUMN IF NOT EXISTS highlights_skills JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS improvements_skills JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing content data
-- Copy existing content to both highlights and improvements for backward compatibility
UPDATE public.feedback
SET 
  highlights = COALESCE(highlights, content),
  improvements = COALESCE(improvements, content),
  highlights_skills = COALESCE(highlights_skills, '[]'::jsonb),
  improvements_skills = COALESCE(improvements_skills, '[]'::jsonb)
WHERE content IS NOT NULL AND (highlights IS NULL OR improvements IS NULL);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_highlights_skills ON public.feedback USING GIN (highlights_skills);
CREATE INDEX IF NOT EXISTS idx_feedback_improvements_skills ON public.feedback USING GIN (improvements_skills);

-- Note: The 'content' column is kept for backward compatibility
-- You can drop it later after confirming all data is migrated:
-- ALTER TABLE public.feedback DROP COLUMN IF EXISTS content;
