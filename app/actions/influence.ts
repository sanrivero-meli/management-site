'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MemberInfluence } from '@/types'

/**
 * Get all influence relationships for a specific team member (as source)
 */
export async function getInfluenceForMember(sourceMemberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_influence')
    .select('*')
    .eq('source_member_id', sourceMemberId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch influence relationships: ${error.message}`)
  }

  return (data || []) as MemberInfluence[]
}

/**
 * Get all team members except the specified one (for populating influence targets)
 */
export async function getOtherTeamMembers(excludeMemberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .select('id, name, email')
    .neq('id', excludeMemberId)
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`)
  }

  return data || []
}

/**
 * Upsert an influence relationship (create or update)
 */
export async function updateInfluence(
  sourceMemberId: string,
  targetMemberId: string,
  influenceLevel: number
) {
  const supabase = await createClient()

  // Validate influence level
  if (influenceLevel < 1 || influenceLevel > 5) {
    return { error: 'Influence level must be between 1 and 5' }
  }

  // Prevent self-influence
  if (sourceMemberId === targetMemberId) {
    return { error: 'A team member cannot influence themselves' }
  }

  const { data, error } = await supabase
    .from('member_influence')
    .upsert(
      {
        source_member_id: sourceMemberId,
        target_member_id: targetMemberId,
        influence_level: influenceLevel,
      },
      {
        onConflict: 'source_member_id,target_member_id',
      }
    )
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${sourceMemberId}`)
  return { data: data as MemberInfluence }
}

/**
 * Delete an influence relationship
 */
export async function deleteInfluence(sourceMemberId: string, targetMemberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('member_influence')
    .delete()
    .eq('source_member_id', sourceMemberId)
    .eq('target_member_id', targetMemberId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/team/${sourceMemberId}`)
  return { success: true }
}
