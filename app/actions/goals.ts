'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Goal } from '@/types'

export async function getGoals(teamMemberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('team_member_id', teamMemberId)
    .order('target_date', { nullsFirst: false })

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`)
  }

  return data as Goal[]
}

export async function getGoal(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch goal: ${error.message}`)
  }

  return data as Goal
}

export async function createGoal(formData: FormData) {
  const supabase = await createClient()

  // Parse key_actions array from form data
  const keyActions: string[] = []
  let i = 0
  while (formData.get(`key_actions_${i}`)) {
    const action = formData.get(`key_actions_${i}`) as string
    if (action.trim()) {
      keyActions.push(action.trim())
    }
    i++
  }

  // Parse kpis array from form data
  const kpis: string[] = []
  i = 0
  while (formData.get(`kpis_${i}`)) {
    const kpi = formData.get(`kpis_${i}`) as string
    if (kpi.trim()) {
      kpis.push(kpi.trim())
    }
    i++
  }

  // Parse related_skills array from checkbox values
  const relatedSkills: string[] = []
  const allSkills = [
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
  ]
  
  allSkills.forEach((skill) => {
    if (formData.get(`related_skills_${skill}`)) {
      relatedSkills.push(skill)
    }
  })

  const data = {
    team_member_id: formData.get('team_member_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    key_actions: keyActions.length > 0 ? keyActions : null,
    kpis: kpis.length > 0 ? kpis : null,
    target_date: formData.get('target_date') as string || null,
    status: (formData.get('status') as Goal['status']) || 'Not Started',
    related_skills: relatedSkills.length > 0 ? relatedSkills : null,
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${data.team_member_id}`)
  return { data: goal }
}

export async function updateGoal(id: string, formData: FormData) {
  const supabase = await createClient()

  const data: Partial<Goal> = {}
  
  const title = formData.get('title')
  const description = formData.get('description')
  const target_date = formData.get('target_date')
  const status = formData.get('status')

  // Parse key_actions array from form data
  const keyActions: string[] = []
  let i = 0
  while (formData.get(`key_actions_${i}`)) {
    const action = formData.get(`key_actions_${i}`) as string
    if (action.trim()) {
      keyActions.push(action.trim())
    }
    i++
  }

  // Parse kpis array from form data
  const kpis: string[] = []
  i = 0
  while (formData.get(`kpis_${i}`)) {
    const kpi = formData.get(`kpis_${i}`) as string
    if (kpi.trim()) {
      kpis.push(kpi.trim())
    }
    i++
  }

  // Parse related_skills array from checkbox values
  const relatedSkills: string[] = []
  const allSkills = [
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
  ]
  
  allSkills.forEach((skill) => {
    if (formData.get(`related_skills_${skill}`)) {
      relatedSkills.push(skill)
    }
  })

  if (title) data.title = title as string
  if (description !== null) data.description = description as string | null
  data.key_actions = keyActions.length > 0 ? keyActions : null
  data.kpis = kpis.length > 0 ? kpis : null
  if (target_date !== null) data.target_date = target_date as string | null
  if (status) data.status = status as Goal['status']
  data.related_skills = relatedSkills.length > 0 ? relatedSkills : null

  const { data: goal, error } = await supabase
    .from('goals')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${goal.team_member_id}`)
  return { data: goal }
}

export async function deleteGoal(id: string, teamMemberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${teamMemberId}`)
  return { success: true }
}
