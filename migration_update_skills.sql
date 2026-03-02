-- Migration: Update Skills Table Structure
-- Run this SQL in your Supabase SQL Editor
-- WARNING: This will delete all existing skill data

-- Drop old skill columns
ALTER TABLE public.skills DROP COLUMN IF EXISTS communication_collaboration;
ALTER TABLE public.skills DROP COLUMN IF EXISTS systems_thinking;
ALTER TABLE public.skills DROP COLUMN IF EXISTS decision_making;
ALTER TABLE public.skills DROP COLUMN IF EXISTS resilience;
ALTER TABLE public.skills DROP COLUMN IF EXISTS ai_proficiency;
ALTER TABLE public.skills DROP COLUMN IF EXISTS goal_setting;
ALTER TABLE public.skills DROP COLUMN IF EXISTS heuristics;
ALTER TABLE public.skills DROP COLUMN IF EXISTS methodologies;
ALTER TABLE public.skills DROP COLUMN IF EXISTS problem_framing;
ALTER TABLE public.skills DROP COLUMN IF EXISTS accessibility;
ALTER TABLE public.skills DROP COLUMN IF EXISTS data_driven;
ALTER TABLE public.skills DROP COLUMN IF EXISTS user_research;
ALTER TABLE public.skills DROP COLUMN IF EXISTS ideation_prototyping;
ALTER TABLE public.skills DROP COLUMN IF EXISTS craft;
ALTER TABLE public.skills DROP COLUMN IF EXISTS briefing;
ALTER TABLE public.skills DROP COLUMN IF EXISTS ux_writing_principles;
ALTER TABLE public.skills DROP COLUMN IF EXISTS style_guide;
ALTER TABLE public.skills DROP COLUMN IF EXISTS localization_adaptation;
ALTER TABLE public.skills DROP COLUMN IF EXISTS help_content;
ALTER TABLE public.skills DROP COLUMN IF EXISTS ui_design_principles;
ALTER TABLE public.skills DROP COLUMN IF EXISTS interaction_design;
ALTER TABLE public.skills DROP COLUMN IF EXISTS design_systems_andes;

-- Add new skill columns
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS pensamiento_critico INTEGER CHECK (pensamiento_critico >= 0 AND pensamiento_critico <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS vision_sistemica INTEGER CHECK (vision_sistemica >= 0 AND vision_sistemica <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS argumentacion_facilitacion INTEGER CHECK (argumentacion_facilitacion >= 0 AND argumentacion_facilitacion <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS adopcion_ai_nuevas_tecnologias INTEGER CHECK (adopcion_ai_nuevas_tecnologias >= 0 AND adopcion_ai_nuevas_tecnologias <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS conocimiento_usuario INTEGER CHECK (conocimiento_usuario >= 0 AND conocimiento_usuario <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS problem_framing_briefing INTEGER CHECK (problem_framing_briefing >= 0 AND problem_framing_briefing <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS ideacion_prototipado INTEGER CHECK (ideacion_prototipado >= 0 AND ideacion_prototipado <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS propuestas_out_of_the_box INTEGER CHECK (propuestas_out_of_the_box >= 0 AND propuestas_out_of_the_box <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS principios_diseno INTEGER CHECK (principios_diseno >= 0 AND principios_diseno <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS sistema_diseno INTEGER CHECK (sistema_diseno >= 0 AND sistema_diseno <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS visual_polishing INTEGER CHECK (visual_polishing >= 0 AND visual_polishing <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS escritura_ux INTEGER CHECK (escritura_ux >= 0 AND escritura_ux <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS narrativa_estrategia INTEGER CHECK (narrativa_estrategia >= 0 AND narrativa_estrategia <= 3);
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS sistema_contenidos INTEGER CHECK (sistema_contenidos >= 0 AND sistema_contenidos <= 3);

-- Add skill_descriptions column if it doesn't exist
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS skill_descriptions JSONB;

-- Note: user_journey_flow column is kept as it exists in both old and new schemas
