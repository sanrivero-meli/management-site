'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Feedback } from '@/types'

export async function getFeedback(teamMemberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('team_member_id', teamMemberId)
    .order('feedback_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch feedback: ${error.message}`)
  }

  return data as Feedback[]
}

export async function createFeedback(formData: FormData) {
  const supabase = await createClient()

  // Parse highlights_skills array from checkbox values
  const highlightsSkills: string[] = []
  const improvementsSkills: string[] = []
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
    if (formData.get(`highlights_skills_${skill}`)) {
      highlightsSkills.push(skill)
    }
    if (formData.get(`improvements_skills_${skill}`)) {
      improvementsSkills.push(skill)
    }
  })

  const highlights = formData.get('highlights') as string
  const improvements = formData.get('improvements') as string
  
  const data = {
    team_member_id: formData.get('team_member_id') as string,
    cycle: formData.get('cycle') as string,
    content: highlights, // Required for backward compatibility with NOT NULL constraint
    highlights,
    improvements,
    highlights_skills: highlightsSkills.length > 0 ? highlightsSkills : null,
    improvements_skills: improvementsSkills.length > 0 ? improvementsSkills : null,
    feedback_date: formData.get('feedback_date') as string || new Date().toISOString().split('T')[0],
  }

  const { data: feedback, error } = await supabase
    .from('feedback')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${data.team_member_id}`)
  return { data: feedback }
}

export async function updateFeedback(id: string, formData: FormData) {
  const supabase = await createClient()

  const data: Partial<Feedback> = {}
  
  const cycle = formData.get('cycle')
  const highlights = formData.get('highlights')
  const improvements = formData.get('improvements')
  const feedback_date = formData.get('feedback_date')

  // Parse highlights_skills array from checkbox values
  const highlightsSkills: string[] = []
  const improvementsSkills: string[] = []
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
    if (formData.get(`highlights_skills_${skill}`)) {
      highlightsSkills.push(skill)
    }
    if (formData.get(`improvements_skills_${skill}`)) {
      improvementsSkills.push(skill)
    }
  })

  if (cycle) data.cycle = cycle as string
  if (highlights !== null) {
    data.highlights = highlights as string
    data.content = highlights as string // Required for backward compatibility with NOT NULL constraint
  }
  if (improvements !== null) data.improvements = improvements as string
  if (feedback_date) data.feedback_date = feedback_date as string
  data.highlights_skills = highlightsSkills.length > 0 ? highlightsSkills : null
  data.improvements_skills = improvementsSkills.length > 0 ? improvementsSkills : null

  const { data: feedback, error } = await supabase
    .from('feedback')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${feedback.team_member_id}`)
  return { data: feedback }
}

export async function deleteFeedback(id: string, teamMemberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${teamMemberId}`)
  return { success: true }
}
