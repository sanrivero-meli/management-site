'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TeamMember } from '@/types'

export async function getTeamMembers() {
  const supabase = await createClient()
  
  // Fetch team members with skills
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      skills (
        overall_rating
      )
    `)
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`)
  }

  // Fetch all influence relationships to calculate averages
  const { data: influenceData, error: influenceError } = await supabase
    .from('member_influence')
    .select('source_member_id, influence_level')

  if (influenceError) {
    console.error('Failed to fetch influence data:', influenceError.message)
  }

  // Calculate average influence for each member (as source)
  const influenceAverages: Record<string, number> = {}
  if (influenceData && influenceData.length > 0) {
    const groupedInfluence: Record<string, number[]> = {}
    for (const inf of influenceData) {
      if (!groupedInfluence[inf.source_member_id]) {
        groupedInfluence[inf.source_member_id] = []
      }
      groupedInfluence[inf.source_member_id].push(inf.influence_level)
    }
    for (const [memberId, levels] of Object.entries(groupedInfluence)) {
      influenceAverages[memberId] = levels.reduce((a, b) => a + b, 0) / levels.length
    }
  }

  // Transform the data to handle Supabase's relation format
  return (data || []).map((member: any) => ({
    ...member,
    skills: Array.isArray(member.skills) && member.skills.length > 0 
      ? member.skills[0] 
      : member.skills || null,
    avg_influence: influenceAverages[member.id] ?? null
  })) as (TeamMember & { skills: { overall_rating: number | null } | null; avg_influence: number | null })[]
}

export async function getTeamMember(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch team member: ${error.message}`)
  }

  return data as TeamMember
}

export async function createTeamMember(formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    seniority: formData.get('seniority') as string,
    level: parseInt(formData.get('level') as string),
    influence_level: parseInt(formData.get('influence_level') as string),
    motivation_level: parseInt(formData.get('motivation_level') as string),
  }

  const { data: teamMember, error } = await supabase
    .from('team_members')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/team')
  return { data: teamMember }
}

export async function updateTeamMember(id: string, formData: FormData) {
  const supabase = await createClient()

  const data: Partial<TeamMember> = {}
  
  const name = formData.get('name')
  const email = formData.get('email')
  const seniority = formData.get('seniority')
  const level = formData.get('level')
  const influence_level = formData.get('influence_level')
  const motivation_level = formData.get('motivation_level')

  if (name) data.name = name as string
  if (email) data.email = email as string
  if (seniority) data.seniority = seniority as string
  if (level) data.level = parseInt(level as string)
  if (influence_level) data.influence_level = parseInt(influence_level as string)
  if (motivation_level) data.motivation_level = parseInt(motivation_level as string)

  const { error } = await supabase
    .from('team_members')
    .update(data)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/team')
  revalidatePath(`/team/${id}`)
  return { success: true }
}

export async function deleteTeamMember(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/team')
  return { success: true }
}
