-- Migration: Remove role column from team_members table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.team_members DROP COLUMN IF EXISTS role;
