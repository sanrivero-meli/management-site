'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Skills, SkillsHistory, SkillsComparison } from '@/types'

const SKILL_KEYS = [
  'pensamiento_critico',
  'vision_sistemica',
  'argumentacion_facilitacion',
  'adopcion_ai_nuevas_tecnologias',
  'conocimiento_usuario',
  'problem_framing_briefing',
  'ideacion_prototipado',
  'user_journey_flow',
  'propuestas_out_of_the_box',
  'principios_diseno',
  'sistema_diseno',
  'visual_polishing',
  'escritura_ux',
  'narrativa_estrategia',
  'sistema_contenidos',
] as const

function extractSkillsFromFormData(formData: FormData) {
  const skills: Record<string, number> = {}
  let totalRating = 0
  let skillCount = 0

  SKILL_KEYS.forEach((key) => {
    const value = formData.get(key)
    if (value !== null) {
      const rating = parseInt(value as string)
      skills[key] = rating
      totalRating += rating
      skillCount++
    }
  })

  const overallRating = skillCount > 0 ? Math.round((totalRating / skillCount) * 10) / 10 : 0

  // Extract comments for each skill
  const skillComments: Record<string, string> = {}
  SKILL_KEYS.forEach((key) => {
    const comment = formData.get(`${key}_comment`) as string
    if (comment !== null && comment.trim() !== '') {
      skillComments[key] = comment.trim()
    }
  })

  return {
    skills,
    overallRating,
    skillComments: Object.keys(skillComments).length > 0 ? skillComments : null,
  }
}

export async function getSkills(teamMemberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('team_member_id', teamMemberId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch skills: ${error.message}`)
  }

  return data as Skills | null
}

export async function upsertSkills(formData: FormData) {
  // Keep for backward compatibility - publishes immediately (is_draft = false)
  const supabase = await createClient()
  const teamMemberId = formData.get('team_member_id') as string
  const { skills, overallRating, skillComments } = extractSkillsFromFormData(formData)

  const data = {
    team_member_id: teamMemberId,
    ...skills,
    overall_rating: overallRating,
    skill_comments: skillComments,
    is_draft: false,
  }

  const { data: skillsData, error } = await supabase
    .from('skills')
    .upsert(data, { onConflict: 'team_member_id' })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${teamMemberId}`)
  return { data: skillsData }
}

export async function saveDraft(formData: FormData) {
  const supabase = await createClient()
  const teamMemberId = formData.get('team_member_id') as string
  const { skills, overallRating, skillComments } = extractSkillsFromFormData(formData)

  const data = {
    team_member_id: teamMemberId,
    ...skills,
    overall_rating: overallRating,
    skill_comments: skillComments,
    is_draft: true,
  }

  const { data: skillsData, error } = await supabase
    .from('skills')
    .upsert(data, { onConflict: 'team_member_id' })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${teamMemberId}`)
  return { data: skillsData }
}

export async function publishSnapshot(teamMemberId: string, versionName?: string) {
  const supabase = await createClient()

  // Get current draft skills
  const { data: currentSkills, error: fetchError } = await supabase
    .from('skills')
    .select('*')
    .eq('team_member_id', teamMemberId)
    .single()

  if (fetchError) {
    return { error: `Failed to fetch current skills: ${fetchError.message}` }
  }

  if (!currentSkills) {
    return { error: 'No skills found to publish' }
  }

  // Create history record
  const historyData = {
    team_member_id: teamMemberId,
    version_name: versionName?.trim() || null,
    version_date: new Date().toISOString(),
    pensamiento_critico: currentSkills.pensamiento_critico,
    vision_sistemica: currentSkills.vision_sistemica,
    argumentacion_facilitacion: currentSkills.argumentacion_facilitacion,
    adopcion_ai_nuevas_tecnologias: currentSkills.adopcion_ai_nuevas_tecnologias,
    conocimiento_usuario: currentSkills.conocimiento_usuario,
    problem_framing_briefing: currentSkills.problem_framing_briefing,
    ideacion_prototipado: currentSkills.ideacion_prototipado,
    user_journey_flow: currentSkills.user_journey_flow,
    propuestas_out_of_the_box: currentSkills.propuestas_out_of_the_box,
    principios_diseno: currentSkills.principios_diseno,
    sistema_diseno: currentSkills.sistema_diseno,
    visual_polishing: currentSkills.visual_polishing,
    escritura_ux: currentSkills.escritura_ux,
    narrativa_estrategia: currentSkills.narrativa_estrategia,
    sistema_contenidos: currentSkills.sistema_contenidos,
    overall_rating: currentSkills.overall_rating,
    skill_comments: currentSkills.skill_comments,
  }

  const { data: historyRecord, error: historyError } = await supabase
    .from('skills_history')
    .insert(historyData)
    .select()
    .single()

  if (historyError) {
    return { error: `Failed to create history record: ${historyError.message}` }
  }

  // Update skills to mark as published (is_draft = false)
  const { data: updatedSkills, error: updateError } = await supabase
    .from('skills')
    .update({ is_draft: false })
    .eq('team_member_id', teamMemberId)
    .select()
    .single()

  if (updateError) {
    return { error: `Failed to update skills: ${updateError.message}` }
  }

  revalidatePath(`/team/${teamMemberId}`)
  return { data: { skills: updatedSkills, history: historyRecord } }
}

export async function getSkillsHistory(teamMemberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skills_history')
    .select('*')
    .eq('team_member_id', teamMemberId)
    .order('version_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch skills history: ${error.message}`)
  }

  return data as SkillsHistory[]
}

export async function getSkillsVersion(versionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skills_history')
    .select('*')
    .eq('id', versionId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch skills version: ${error.message}`)
  }

  return data as SkillsHistory
}

export async function compareSkillsVersions(versionId1: string, versionId2: string) {
  const supabase = await createClient()

  // Fetch both versions
  const { data: version1, error: error1 } = await supabase
    .from('skills_history')
    .select('*')
    .eq('id', versionId1)
    .single()

  const { data: version2, error: error2 } = await supabase
    .from('skills_history')
    .select('*')
    .eq('id', versionId2)
    .single()

  if (error1 || error2) {
    throw new Error(`Failed to fetch versions: ${error1?.message || error2?.message}`)
  }

  // Calculate deltas
  const deltas: Record<string, number> = {}
  SKILL_KEYS.forEach((key) => {
    const v1Value = (version1[key as keyof typeof version1] as number) || 0
    const v2Value = (version2[key as keyof typeof version2] as number) || 0
    deltas[key] = v2Value - v1Value
  })

  // Also calculate overall rating delta
  deltas.overall_rating = (version2.overall_rating || 0) - (version1.overall_rating || 0)

  return {
    version1: version1 as SkillsHistory,
    version2: version2 as SkillsHistory,
    deltas,
  } as SkillsComparison
}
