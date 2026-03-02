'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MemberPerformanceProject } from '@/types'

export async function getPerformanceProjects(teamMemberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_performance_projects')
    .select('*')
    .eq('team_member_id', teamMemberId)
    .order('start_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch performance projects: ${error.message}`)
  }

  return data as MemberPerformanceProject[]
}

export async function createPerformanceProject(formData: FormData) {
  const supabase = await createClient()

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

  // Parse links array from form data
  const links: Array<{ label: string; url: string }> = []
  let i = 0
  while (formData.get(`link_label_${i}`) && formData.get(`link_url_${i}`)) {
    const label = formData.get(`link_label_${i}`) as string
    const url = formData.get(`link_url_${i}`) as string
    if (label.trim() && url.trim()) {
      links.push({ label: label.trim(), url: url.trim() })
    }
    i++
  }

  const projectId = formData.get('project_id') as string
  const projectName = formData.get('project_name') as string

  const data = {
    team_member_id: formData.get('team_member_id') as string,
    project_id: projectId && projectId !== 'new' ? projectId : null,
    project_name: projectName || '',
    start_date: formData.get('start_date') as string,
    end_date: (formData.get('end_date') as string) || null,
    status: (formData.get('status') as MemberPerformanceProject['status']) || 'Planning',
    related_skills: relatedSkills.length > 0 ? relatedSkills : null,
    comments: (formData.get('comments') as string) || null,
    links: links.length > 0 ? links : null,
  }

  const { data: project, error } = await supabase
    .from('member_performance_projects')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${data.team_member_id}`)
  return { data: project }
}

export async function updatePerformanceProject(id: string, formData: FormData) {
  const supabase = await createClient()

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

  // Parse links array from form data
  const links: Array<{ label: string; url: string }> = []
  let i = 0
  while (formData.get(`link_label_${i}`) && formData.get(`link_url_${i}`)) {
    const label = formData.get(`link_label_${i}`) as string
    const url = formData.get(`link_url_${i}`) as string
    if (label.trim() && url.trim()) {
      links.push({ label: label.trim(), url: url.trim() })
    }
    i++
  }

  const data: Partial<MemberPerformanceProject> = {}
  
  const projectId = formData.get('project_id')
  const projectName = formData.get('project_name')
  const startDate = formData.get('start_date')
  const endDate = formData.get('end_date')
  const status = formData.get('status')
  const comments = formData.get('comments')

  if (projectId) {
    data.project_id = projectId === 'new' ? null : (projectId as string)
  }
  if (projectName !== null) {
    data.project_name = projectName as string
  }
  if (startDate) {
    data.start_date = startDate as string
  }
  if (endDate !== null) {
    data.end_date = endDate ? (endDate as string) : null
  }
  if (status) {
    data.status = status as MemberPerformanceProject['status']
  }
  data.related_skills = relatedSkills.length > 0 ? relatedSkills : null
  if (comments !== null) {
    data.comments = comments ? (comments as string) : null
  }
  data.links = links.length > 0 ? links : null

  const { data: project, error } = await supabase
    .from('member_performance_projects')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${project.team_member_id}`)
  return { data: project }
}

export async function deletePerformanceProject(id: string, teamMemberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('member_performance_projects')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${teamMemberId}`)
  return { success: true }
}
