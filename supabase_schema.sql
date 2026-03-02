-- Supabase Database Schema - Complete Schema
-- Run this SQL in your Supabase SQL Editor to create/update all required tables
-- This schema includes all migrations consolidated into one file

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Table: team_members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    seniority TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
    influence_level INTEGER NOT NULL CHECK (influence_level >= 1 AND influence_level <= 5),
    motivation_level INTEGER NOT NULL CHECK (motivation_level >= 1 AND motivation_level <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email)
);

-- Table: projects (with all additional fields)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    scope TEXT,
    jira_link TEXT,
    status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'To Do', 'Doing', 'Paused', 'Done', 'Cancelled')),
    -- Additional project fields
    priority TEXT CHECK (priority IS NULL OR priority IN ('HIT', 'Carryover', 'BAU', 'World Class', 'Wishlist', 'Quality')),
    category TEXT CHECK (category IS NULL OR category IN ('Legal', 'Delivery', 'Research', 'Support')),
    squad TEXT CHECK (squad IS NULL OR squad IN ('Long Term', 'Short Term', 'Backoffice', 'Cross')),
    tags JSONB DEFAULT '[]'::jsonb,
    owners JSONB DEFAULT '[]'::jsonb,
    product_owner TEXT,
    start_date DATE,
    end_date DATE,
    estimated NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: goals
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    key_actions JSONB DEFAULT '[]'::jsonb,
    kpis JSONB DEFAULT '[]'::jsonb,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Complete')),
    related_skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: feedback
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    cycle TEXT NOT NULL,
    content TEXT, -- Kept for backward compatibility
    highlights TEXT,
    improvements TEXT,
    highlights_skills JSONB DEFAULT '[]'::jsonb,
    improvements_skills JSONB DEFAULT '[]'::jsonb,
    feedback_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    sprints_allocated NUMERIC(10, 2) NOT NULL CHECK (sprints_allocated > 0),
    quarter TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: skills (with all skill columns)
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
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
    -- Skill metadata
    skill_descriptions JSONB,
    skill_comments JSONB,
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_member_id)
);

-- ============================================================================
-- ADDITIONAL TABLES
-- ============================================================================

-- Table: project_tasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    deliverables TEXT,
    start_date DATE,
    end_date DATE,
    owner_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Not Started' 
      CHECK (status IN ('Not Started', 'In Progress', 'Blocked', 'Complete')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: project_milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    color TEXT DEFAULT '#ef4444',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: member_performance_projects
CREATE TABLE IF NOT EXISTS public.member_performance_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'On Hold', 'Complete', 'Cancelled')),
    related_skills JSONB DEFAULT '[]'::jsonb,
    comments TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: skills_history
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

-- Table: member_influence
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

-- Table: todo_categories
CREATE TABLE IF NOT EXISTS public.todo_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: todos
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    due_date DATE,
    category_id UUID REFERENCES public.todo_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON public.skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_performance_projects_updated_at BEFORE UPDATE ON public.member_performance_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_influence_updated_at BEFORE UPDATE ON public.member_influence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_team_member_id ON public.goals(team_member_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON public.goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_related_skills ON public.goals USING GIN (related_skills);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_team_member_id ON public.feedback(team_member_id);
CREATE INDEX IF NOT EXISTS idx_feedback_feedback_date ON public.feedback(feedback_date);
CREATE INDEX IF NOT EXISTS idx_feedback_highlights_skills ON public.feedback USING GIN (highlights_skills);
CREATE INDEX IF NOT EXISTS idx_feedback_improvements_skills ON public.feedback USING GIN (improvements_skills);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON public.assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_team_member_id ON public.assignments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_assignments_quarter ON public.assignments(quarter);

-- Skills indexes
CREATE INDEX IF NOT EXISTS idx_skills_team_member_id ON public.skills(team_member_id);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_squad ON public.projects(squad);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_projects_owners ON public.projects USING GIN (owners);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON public.projects(end_date);

-- Project tasks indexes
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_owner_id ON public.project_tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);

-- Project milestones indexes
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_date ON public.project_milestones(date);

-- Member performance projects indexes
CREATE INDEX IF NOT EXISTS idx_member_performance_projects_team_member_id ON public.member_performance_projects(team_member_id);
CREATE INDEX IF NOT EXISTS idx_member_performance_projects_status ON public.member_performance_projects(status);
CREATE INDEX IF NOT EXISTS idx_member_performance_projects_start_date ON public.member_performance_projects(start_date);

-- Skills history indexes
CREATE INDEX IF NOT EXISTS idx_skills_history_team_member_id ON public.skills_history(team_member_id);
CREATE INDEX IF NOT EXISTS idx_skills_history_version_date ON public.skills_history(version_date DESC);

-- Member influence indexes
CREATE INDEX IF NOT EXISTS idx_member_influence_source ON public.member_influence(source_member_id);
CREATE INDEX IF NOT EXISTS idx_member_influence_target ON public.member_influence(target_member_id);

-- Todos indexes
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_category_id ON public.todos(category_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todo_categories_user_id ON public.todo_categories(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_performance_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_influence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.team_members;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.goals;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.feedback;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.skills;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.project_tasks;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.project_milestones;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.member_performance_projects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.skills_history;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.member_influence;
DROP POLICY IF EXISTS "Users can manage own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.todo_categories;

-- Create policies for authenticated users (most tables)
CREATE POLICY "Allow all operations for authenticated users" ON public.team_members
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.projects
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.goals
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.feedback
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.assignments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.skills
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.project_tasks
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.project_milestones
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.member_performance_projects
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.skills_history
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.member_influence
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for user-specific tables (todos)
CREATE POLICY "Users can manage own todos" ON public.todos
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON public.todo_categories
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- This schema consolidates all migrations:
-- - migration_add_project_fields.sql
-- - migration_add_project_dates.sql
-- - migration_add_project_tasks.sql
-- - migration_add_milestones.sql
-- - migration_add_performance_projects.sql
-- - migration_add_skills_history.sql
-- - migration_add_skill_comments.sql
-- - migration_add_member_influence.sql
-- - migration_add_todos.sql
-- - migration_add_key_actions.sql
-- - migration_support_decimal_sprints.sql
-- - migration_update_feedback_structure.sql
-- - migration_update_goals.sql
-- - migration_update_skills.sql
-- - migration_remove_role.sql
