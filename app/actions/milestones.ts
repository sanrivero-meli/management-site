'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProjectMilestone } from '@/types'

export async function getProjectMilestones(projectId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch milestones: ${error.message}`)
  }

  return (data || []) as ProjectMilestone[]
}

export async function createMilestone(formData: FormData) {
  const supabase = await createClient()

  const projectId = formData.get('project_id') as string
  const name = formData.get('name') as string
  const date = formData.get('date') as string
  const color = formData.get('color') as string || '#ef4444'

  if (!projectId || !name || !date) {
    return { error: 'Project ID, name, and date are required' }
  }

  const data = {
    project_id: projectId,
    name,
    date,
    color,
  }

  const { data: milestone, error } = await supabase
    .from('project_milestones')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { data: milestone }
}

export async function updateMilestone(id: string, formData: FormData) {
  const supabase = await createClient()

  const data: Partial<ProjectMilestone> = {}
  
  const name = formData.get('name')
  const date = formData.get('date')
  const color = formData.get('color')

  if (name) data.name = name as string
  if (date) data.date = date as string
  if (color) data.color = color as string

  const { data: milestone, error: fetchError } = await supabase
    .from('project_milestones')
    .select('project_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error } = await supabase
    .from('project_milestones')
    .update(data)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${milestone.project_id}`)
  return { success: true }
}

export async function deleteMilestone(id: string) {
  const supabase = await createClient()

  const { data: milestone, error: fetchError } = await supabase
    .from('project_milestones')
    .select('project_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${milestone.project_id}`)
  return { success: true }
}
