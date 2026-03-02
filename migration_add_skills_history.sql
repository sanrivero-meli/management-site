-- Migration: Add skills_history table and is_draft column to skills table
-- This enables versioning of skills with draft workflow

-- Add is_draft column to skills table
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

-- Create skills_history table to store published skill snapshots
CREATE TABLE IF NOT EXISTS public.skills_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    version_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version_name TEXT,
    -- Core (4 skills)
    pensamiento_critico INTEGER CHECK (pensamiento_critico >= 0 AND pensamiento_critico <= 3),
    vision_sistemica INTEGER CHECK (vision_sistemica >= 0 AND vision_sistemica <= 3),
    argumentacion_facilitacion INTEGER CHECK (argumentacion_facilitacion >= 0 AND argumentacion_facilitacion <= 3),
    adopcion_ai_nuevas_tecnologias INTEGER CHECK (adopcion_ai_nuevas_tecnologias >= 0 AND adopcion_ai_nuevas_tecnologias <= 3),
    -- Product Design (5 skills)
    conocimiento_usuario INTEGER CHECK (conocimiento_usuario >= 0 AND conocimiento_usuario <= 3),
    problem_framing_briefing INTEGER CHECK (problem_framing_briefing >= 0 AND problem_framing_briefing <= 3),
    ideacion_prototipado INTEGER CHECK (ideacion_prototipado >= 0 AND ideacion_prototipado <= 3),
    user_journey_flow INTEGER CHECK (user_journey_flow >= 0 AND user_journey_flow <= 3),
    propuestas_out_of_the_box INTEGER CHECK (propuestas_out_of_the_box >= 0 AND propuestas_out_of_the_box <= 3),
    -- Visual Design (3 skills)
    principios_diseno INTEGER CHECK (principios_diseno >= 0 AND principios_diseno <= 3),
    sistema_diseno INTEGER CHECK (sistema_diseno >= 0 AND sistema_diseno <= 3),
    visual_polishing INTEGER CHECK (visual_polishing >= 0 AND visual_polishing <= 3),
    -- Content Strategy (3 skills)
    escritura_ux INTEGER CHECK (escritura_ux >= 0 AND escritura_ux <= 3),
    narrativa_estrategia INTEGER CHECK (narrativa_estrategia >= 0 AND narrativa_estrategia <= 3),
    sistema_contenidos INTEGER CHECK (sistema_contenidos >= 0 AND sistema_contenidos <= 3),
    -- Overall rating
    overall_rating NUMERIC(3,1) CHECK (overall_rating >= 0 AND overall_rating <= 3),
    -- Skill comments stored as JSONB
    skill_comments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_skills_history_team_member_id ON public.skills_history(team_member_id);
CREATE INDEX IF NOT EXISTS idx_skills_history_version_date ON public.skills_history(version_date DESC);

-- Enable Row Level Security
ALTER TABLE public.skills_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.skills_history
    FOR ALL USING (auth.role() = 'authenticated');
