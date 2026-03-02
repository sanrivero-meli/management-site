-- Migration: Support decimal sprint values in assignments table
-- Run this SQL in your Supabase SQL Editor

-- Change sprints_allocated from INTEGER to NUMERIC(10, 2) to support decimal values
ALTER TABLE public.assignments 
ALTER COLUMN sprints_allocated TYPE NUMERIC(10, 2) USING sprints_allocated::NUMERIC(10, 2);

-- Update check constraint to work with decimals (already allows > 0, which works for decimals)
-- The constraint sprints_allocated > 0 already works correctly with NUMERIC type
