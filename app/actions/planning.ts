'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  TeamMemberWithSkills,
  AssignmentWithDetails,
  Project,
  JiraEpic,
  MemberPerformanceProject,
  MemberInfluence,
  SkillRequirement,
} from '@/types'

// ─── Reads ───────────────────────────────────────────────

export async function getTeamWithSkills(): Promise<TeamMemberWithSkills[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      skills (*)
    `)
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch team with skills: ${error.message}`)
  }

  return (data || []).map((member: Record<string, unknown>) => ({
    ...member,
    skills: Array.isArray(member.skills) && member.skills.length > 0
      ? member.skills[0]
      : member.skills || null,
  })) as TeamMemberWithSkills[]
}

export async function getQuarterAssignments(quarter: string): Promise<AssignmentWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      project:projects (name, jira_key, priority),
      team_member:team_members (name, seniority, level)
    `)
    .eq('quarter', quarter)

  if (error) {
    throw new Error(`Failed to fetch quarter assignments: ${error.message}`)
  }

  return (data || []) as AssignmentWithDetails[]
}

export async function getQuarterCapacity(quarter: string) {
  const supabase = await createClient()

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('id, name, seniority, level')
    .order('name')

  if (membersError) {
    throw new Error(`Failed to fetch team members: ${membersError.message}`)
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('team_member_id, sprints_allocated')
    .eq('quarter', quarter)

  if (assignmentsError) {
    throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`)
  }

  const usedSprints: Record<string, number> = {}
  assignments?.forEach((a) => {
    usedSprints[a.team_member_id] = (usedSprints[a.team_member_id] || 0) + Number(a.sprints_allocated)
  })

  return (members || []).map((m) => ({
    ...m,
    used_sprints: usedSprints[m.id] || 0,
    remaining_sprints: 12 - (usedSprints[m.id] || 0),
  }))
}

export async function getProjectsForPlanning(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .not('status', 'in', '("Cancelled")')
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`)
  }

  return (data || []) as Project[]
}

export async function getAllPerformanceHistory(): Promise<Map<string, MemberPerformanceProject[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_performance_projects')
    .select('*')
    .in('status', ['Complete', 'Active'])
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch performance history:', error.message)
    return new Map()
  }

  const map = new Map<string, MemberPerformanceProject[]>()
  for (const row of (data || []) as MemberPerformanceProject[]) {
    if (!map.has(row.team_member_id)) map.set(row.team_member_id, [])
    map.get(row.team_member_id)!.push(row)
  }
  return map
}

export async function getAllInfluenceRelationships(): Promise<Map<string, Map<string, number>>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_influence')
    .select('*')

  if (error) {
    console.error('Failed to fetch influence relationships:', error.message)
    return new Map()
  }

  const map = new Map<string, Map<string, number>>()
  for (const row of (data || []) as MemberInfluence[]) {
    if (!map.has(row.source_member_id)) map.set(row.source_member_id, new Map())
    map.get(row.source_member_id)!.set(row.target_member_id, row.influence_level)
  }
  return map
}

// ─── Jira ────────────────────────────────────────────────

export async function fetchJiraEpics(): Promise<{ epics?: JiraEpic[]; error?: string }> {
  const jiraHost = process.env.JIRA_HOST
  const jiraEmail = process.env.JIRA_EMAIL
  const jiraToken = process.env.JIRA_API_TOKEN

  if (!jiraHost || !jiraEmail || !jiraToken) {
    return { error: 'Jira configuration missing. Set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN.' }
  }

  const jql = 'issuetype = Epic AND project = PRCRED AND "Quarter Year Poroto New[Dropdown]" = Q2-2026 AND cf[15603] in (87086) ORDER BY rank ASC'
  const apiUrl = `https://${jiraHost}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,status,priority&maxResults=100`

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errBody = await res.text()
      return { error: `Jira API error (${res.status}): ${errBody.slice(0, 150)}` }
    }

    const data = await res.json()

    const epics: JiraEpic[] = (data.issues || []).map((issue: Record<string, unknown>) => {
      const f = issue.fields as Record<string, unknown> | undefined
      const s = f?.status as Record<string, unknown> | undefined
      const p = f?.priority as Record<string, unknown> | undefined
      return {
        id: String(issue.id),
        key: String(issue.key),
        summary: String((f?.summary as string) || ''),
        status: String((s?.name as string) || 'Unknown'),
        priority: String((p?.name as string) || 'Medium'),
      }
    })

    return { epics }
  } catch (err) {
    return { error: `Failed to fetch from Jira: ${String(err)}` }
  }
}

// ─── Mutations ───────────────────────────────────────────

export async function syncEpicsToProjects(epics: JiraEpic[]) {
  const supabase = await createClient()
  const jiraHost = process.env.JIRA_HOST

  const results = { created: 0, updated: 0, errors: [] as string[] }

  for (const epic of epics) {
    const projectData = {
      name: epic.summary,
      jira_key: epic.key,
      jira_link: jiraHost ? `https://${jiraHost}/browse/${epic.key}` : null,
      status: epic.status,
    }

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('jira_key', epic.key)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('projects')
        .update({ name: projectData.name, status: projectData.status })
        .eq('jira_key', epic.key)

      if (error) {
        results.errors.push(`Update ${epic.key}: ${error.message}`)
      } else {
        results.updated++
      }
    } else {
      const { error } = await supabase
        .from('projects')
        .insert(projectData)

      if (error) {
        results.errors.push(`Insert ${epic.key}: ${error.message}`)
      } else {
        results.created++
      }
    }
  }

  revalidatePath('/planning')
  return results
}

export async function updateProjectPlanningFields(
  projectId: string,
  data: {
    required_skills?: string[]
    skill_requirements?: SkillRequirement[]
    complexity?: number
    estimated?: number
    team_size?: number | null
  }
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}
  if (data.required_skills !== undefined) updateData.required_skills = data.required_skills
  if (data.skill_requirements !== undefined) updateData.skill_requirements = data.skill_requirements
  if (data.complexity !== undefined) updateData.complexity = data.complexity
  if (data.estimated !== undefined) updateData.estimated = data.estimated
  if (data.team_size !== undefined) updateData.team_size = data.team_size

  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/planning')
  return { success: true }
}

export async function saveAssignments(
  assignments: Array<{
    project_id: string
    team_member_id: string
    sprints_allocated: number
    quarter: string
    role?: string | null
    notes?: string
  }>
) {
  if (assignments.length === 0) return { success: true, count: 0 }

  const supabase = await createClient()
  const projectIds = [...new Set(assignments.map((a) => a.project_id))]
  const quarter = assignments[0].quarter

  // Clear existing assignments for these projects in this quarter
  const { error: deleteError } = await supabase
    .from('assignments')
    .delete()
    .eq('quarter', quarter)
    .in('project_id', projectIds)

  if (deleteError) {
    return { error: `Failed to clear existing assignments: ${deleteError.message}` }
  }

  const { error: insertError } = await supabase
    .from('assignments')
    .insert(
      assignments.map((a) => ({
        project_id: a.project_id,
        team_member_id: a.team_member_id,
        sprints_allocated: a.sprints_allocated,
        quarter: a.quarter,
        role: a.role || null,
        notes: a.notes || null,
      }))
    )

  if (insertError) {
    return { error: `Failed to save assignments: ${insertError.message}` }
  }

  revalidatePath('/planning')
  return { success: true, count: assignments.length }
}

export async function updateJiraStatus(projectId: string, jiraKey: string, newStatus: string) {
  const jiraHost = process.env.JIRA_HOST
  const jiraEmail = process.env.JIRA_EMAIL
  const jiraToken = process.env.JIRA_API_TOKEN

  if (!jiraHost || !jiraEmail || !jiraToken) {
    return { error: 'Jira configuration missing' }
  }

  const { JIRA_TRANSITION_IDS } = await import('@/types')
  const transitionId = JIRA_TRANSITION_IDS[newStatus]
  if (!transitionId) {
    return { error: `Unknown status: ${newStatus}` }
  }

  // Push to Jira
  try {
    const res = await fetch(
      `https://${jiraHost}/rest/api/3/issue/${jiraKey}/transitions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ transition: { id: transitionId } }),
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      const errBody = await res.text()
      return { error: `Jira transition failed (${res.status}): ${errBody.slice(0, 150)}` }
    }
  } catch (err) {
    return { error: `Jira request failed: ${String(err)}` }
  }

  // Update local DB
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ status: newStatus })
    .eq('id', projectId)

  if (error) {
    return { error: `Local update failed: ${error.message}` }
  }

  revalidatePath('/planning')
  return { success: true }
}

export async function deleteAssignment(assignmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/planning')
  return { success: true }
}
