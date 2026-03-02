-- Migration: Add member_influence table for tracking influence relationships between team members
-- Run this SQL in your Supabase SQL Editor
--
-- Note: influence_level must be between 1-5. When "Not set" (value 0) is selected in the UI,
-- the relationship row is deleted entirely rather than storing 0, which maintains data integrity.

-- Create member_influence table
CREATE TABLE IF NOT EXISTS public.member_influence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    target_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    influence_level INTEGER NOT NULL CHECK (influence_level >= 1 AND influence_level <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_member_id, target_member_id),
    CHECK (source_member_id != target_member_id)
);

-- Create trigger for updated_at
CREATE TRIGGER update_member_influence_updated_at BEFORE UPDATE ON public.member_influence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_member_influence_source ON public.member_influence(source_member_id);
CREATE INDEX IF NOT EXISTS idx_member_influence_target ON public.member_influence(target_member_id);

-- Enable Row Level Security
ALTER TABLE public.member_influence ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.member_influence
    FOR ALL USING (auth.role() = 'authenticated');
