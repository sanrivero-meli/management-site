'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Assignment } from '@/types'

export async function getAssignments(quarter?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('assignments')
    .select(`
      *,
      projects:project_id (id, name),
      team_members:team_member_id (id, name)
    `)
    .order('created_at', { ascending: false })

  if (quarter) {
    query = query.eq('quarter', quarter)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch assignments: ${error.message}`)
  }

  return data as (Assignment & {
    projects: { id: string; name: string }
    team_members: { id: string; name: string }
  })[]
}

export async function getCapacityByQuarter(quarter: string) {
  const supabase = await createClient()
  
  // Get all team members
  const { data: teamMembers, error: teamError } = await supabase
    .from('team_members')
    .select('id, name')

  if (teamError) {
    throw new Error(`Failed to fetch team members: ${teamError.message}`)
  }

  // Get assignments for this quarter
  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('team_member_id, sprints_allocated')
    .eq('quarter', quarter)

  if (assignError) {
    throw new Error(`Failed to fetch assignments: ${assignError.message}`)
  }

  // Calculate capacity for each team member
  const capacity = teamMembers.map((member) => {
    const memberAssignments = assignments.filter(
      (a) => a.team_member_id === member.id
    )
    const allocated = memberAssignments.reduce(
      (sum, a) => sum + a.sprints_allocated,
      0
    )

    return {
      team_member_id: member.id,
      name: member.name,
      total_capacity: 12,
      allocated,
      remaining: 12 - allocated,
    }
  })

  return capacity
}

export async function createAssignment(formData: FormData) {
  const supabase = await createClient()

  const data = {
    project_id: formData.get('project_id') as string,
    team_member_id: formData.get('team_member_id') as string,
    sprints_allocated: parseFloat(formData.get('sprints_allocated') as string),
    quarter: formData.get('quarter') as string,
    notes: formData.get('notes') as string || null,
  }

  // Check capacity before creating
  const capacity = await getCapacityByQuarter(data.quarter)
  const memberCapacity = capacity.find(
    (c) => c.team_member_id === data.team_member_id
  )

  if (!memberCapacity) {
    return { error: 'Team member not found' }
  }

  if (memberCapacity.allocated + data.sprints_allocated > 12) {
    return {
      error: `Over-allocation! Member has ${memberCapacity.allocated}/12 sprints allocated. Cannot add ${data.sprints_allocated} more.`,
    }
  }

  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/planning')
  return { data: assignment }
}

export async function updateAssignment(id: string, formData: FormData) {
  const supabase = await createClient()

  // Get current assignment to check capacity
  const { data: currentAssignment, error: fetchError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const newSprints = parseFloat(formData.get('sprints_allocated') as string)
  const quarter = formData.get('quarter') as string || currentAssignment.quarter

  // Check capacity
  const capacity = await getCapacityByQuarter(quarter)
  const memberCapacity = capacity.find(
    (c) => c.team_member_id === currentAssignment.team_member_id
  )

  if (!memberCapacity) {
    return { error: 'Team member not found' }
  }

  const currentAllocated = memberCapacity.allocated - currentAssignment.sprints_allocated
  if (currentAllocated + newSprints > 12) {
    return {
      error: `Over-allocation! Member would have ${currentAllocated + newSprints}/12 sprints allocated. Maximum is 12.`,
    }
  }

  const data: Partial<Assignment> = {}
  
  const project_id = formData.get('project_id')
  const sprints_allocated = formData.get('sprints_allocated')
  const notes = formData.get('notes')

  if (project_id) data.project_id = project_id as string
  if (sprints_allocated) data.sprints_allocated = parseFloat(sprints_allocated as string)
  if (quarter) data.quarter = quarter
  if (notes !== null) data.notes = notes as string | null

  const { error } = await supabase
    .from('assignments')
    .update(data)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/planning')
  return { success: true }
}

export async function deleteAssignment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/planning')
  return { success: true }
}

// Helper function to normalize project names for matching
function normalizeProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Helper function to find project by name (fuzzy matching)
function findProjectByName(
  projects: Array<{ id: string; name: string }>,
  searchName: string
): { id: string; name: string } | null {
  const normalizedSearch = normalizeProjectName(searchName)
  
  // Try exact match first
  const exactMatch = projects.find(
    (p) => normalizeProjectName(p.name) === normalizedSearch
  )
  if (exactMatch) return exactMatch

  // Try case-insensitive match
  const caseInsensitiveMatch = projects.find(
    (p) => p.name.toLowerCase().trim() === searchName.toLowerCase().trim()
  )
  if (caseInsensitiveMatch) return caseInsensitiveMatch

  // Try partial match (contains)
  const partialMatch = projects.find(
    (p) =>
      normalizeProjectName(p.name).includes(normalizedSearch) ||
      normalizedSearch.includes(normalizeProjectName(p.name))
  )
  if (partialMatch) return partialMatch

  return null
}

// Helper function to find team member by short name
function findTeamMemberByName(
  teamMembers: Array<{ id: string; name: string }>,
  shortName: string
): { id: string; name: string } | null {
  const normalizedSearch = shortName.trim().toLowerCase()
  
  // Try exact match first
  const exactMatch = teamMembers.find(
    (m) => m.name.toLowerCase().trim() === normalizedSearch
  )
  if (exactMatch) return exactMatch

  // Try partial match (name contains the short name)
  const partialMatch = teamMembers.find(
    (m) => m.name.toLowerCase().includes(normalizedSearch)
  )
  if (partialMatch) return partialMatch

  // Handle special cases like "Fê" -> "Fé" or "Fê" -> "Fernanda"
  const specialCases: Record<string, string[]> = {
    'fê': ['fé', 'fernanda', 'felipe'],
    'fé': ['fê', 'fernanda', 'felipe'],
    'pris': ['priscila', 'priscilla'],
    'max': ['maximiliano', 'maximo'],
    'patri': ['patricia', 'patricio'],
  }

  const variations = specialCases[normalizedSearch] || []
  for (const variation of variations) {
    const match = teamMembers.find((m) =>
      m.name.toLowerCase().includes(variation)
    )
    if (match) return match
  }

  return null
}

// Helper function to convert European decimal format to standard decimal
function parseDecimal(value: string | null | undefined): number | null {
  if (!value || value.trim() === '' || value === '-') return null
  
  // Replace comma with dot for European format
  const normalized = value.trim().replace(',', '.')
  const parsed = parseFloat(normalized)
  
  return isNaN(parsed) ? null : parsed
}

// Parse tab-separated assignment data
// Format: Project | Estimated | Person 1 | Sprints Allocated (Person 1) | Person 2 (optional) | Sprints Allocated (Person 2, optional)
// Note: Some rows may have extra columns (like totals) that we ignore
function parseAssignmentData(data: string): Array<{
  projectName: string
  estimated: number | null
  assignments: Array<{
    personName: string
    sprintsAllocated: number
  }>
}> {
  const lines = data.split('\n').filter((line) => line.trim() !== '')
  const parsed: Array<{
    projectName: string
    estimated: number | null
    assignments: Array<{
      personName: string
      sprintsAllocated: number
    }>
  }> = []

  // Known team member short names for validation
  const knownNames = ['fê', 'fé', 'pris', 'max', 'patri']

  for (const line of lines) {
    const columns = line.split('\t').map((col) => col.trim())
    
    // Skip empty lines or lines with insufficient data (need at least project, estimated, person1, sprints1)
    if (columns.length < 4) continue

    const projectName = columns[0]
    const estimated = parseDecimal(columns[1])
    const person1 = columns[2]
    const sprints1 = parseDecimal(columns[3])
    
    // Skip if project name is missing
    if (!projectName) continue

    const assignments: Array<{ personName: string; sprintsAllocated: number }> = []

    // Add person 1 assignment if valid
    if (person1 && sprints1 !== null && sprints1 > 0) {
      assignments.push({
        personName: person1,
        sprintsAllocated: Math.round(sprints1), // Convert to integer sprints
      })
    }

    // Look for person 2 - check columns starting from index 4
    // Person 2 should be a name (non-numeric, matches known patterns)
    for (let i = 4; i < columns.length; i++) {
      const col = columns[i]
      if (!col || col === '') continue
      
      // Check if this column looks like a person name
      // It should not be parseable as a number, and should match known name patterns
      const normalizedCol = col.toLowerCase().trim()
      const asNumber = parseDecimal(col)
      const isPersonName = asNumber === null && knownNames.some(name => 
        normalizedCol === name || normalizedCol.includes(name) || name.includes(normalizedCol)
      )
      
      if (isPersonName) {
        const person2 = col
        // Look for sprints in subsequent columns
        // It should be the next non-empty numeric value
        let sprints2: number | null = null
        for (let j = i + 1; j < columns.length; j++) {
          const nextCol = columns[j]
          if (!nextCol || nextCol === '') continue
          const parsedSprints = parseDecimal(nextCol)
          if (parsedSprints !== null && parsedSprints > 0) {
            sprints2 = parsedSprints
            break
          }
        }
        
        // If we found person 2 but no sprints, skip (invalid data)
        if (sprints2 !== null && sprints2 > 0) {
          assignments.push({
            personName: person2,
            sprintsAllocated: Math.round(sprints2),
          })
        }
        break // Found person 2 (or tried to), stop looking
      }
    }

    // Only add if we have at least one valid assignment
    if (assignments.length > 0) {
      parsed.push({
        projectName,
        estimated,
        assignments,
      })
    }
  }

  return parsed
}

// Bulk update assignments from parsed data
export async function bulkUpdateAssignments(
  assignmentsData: string,
  quarter: string
): Promise<{
  success: boolean
  created: number
  updated: number
  errors: Array<{ row: number; message: string }>
  warnings: Array<{ row: number; message: string }>
}> {
  const supabase = await createClient()
  const errors: Array<{ row: number; message: string }> = []
  const warnings: Array<{ row: number; message: string }> = []
  let created = 0
  let updated = 0

  // Fetch all projects and team members
  const [projectsResult, teamMembersResult] = await Promise.all([
    supabase.from('projects').select('id, name'),
    supabase.from('team_members').select('id, name'),
  ])

  if (projectsResult.error) {
    return {
      success: false,
      created: 0,
      updated: 0,
      errors: [{ row: 0, message: `Failed to fetch projects: ${projectsResult.error.message}` }],
      warnings: [],
    }
  }

  if (teamMembersResult.error) {
    return {
      success: false,
      created: 0,
      updated: 0,
      errors: [{ row: 0, message: `Failed to fetch team members: ${teamMembersResult.error.message}` }],
      warnings: [],
    }
  }

  const projects = projectsResult.data || []
  const teamMembers = teamMembersResult.data || []

  // Parse the input data
  const parsedData = parseAssignmentData(assignmentsData)

  // Get current capacity for the quarter
  const capacity = await getCapacityByQuarter(quarter)
  const capacityMap = new Map(
    capacity.map((c) => [c.team_member_id, c])
  )

  // Process each parsed row
  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i]
    const rowNumber = i + 1

    // Find project
    const project = findProjectByName(projects, row.projectName)
    if (!project) {
      errors.push({
        row: rowNumber,
        message: `Project not found: "${row.projectName}"`,
      })
      continue
    }

    // Process each assignment in the row
    for (const assignment of row.assignments) {
      // Find team member
      const teamMember = findTeamMemberByName(teamMembers, assignment.personName)
      if (!teamMember) {
        errors.push({
          row: rowNumber,
          message: `Team member not found: "${assignment.personName}"`,
        })
        continue
      }

      // Check capacity
      const memberCapacity = capacityMap.get(teamMember.id)
      if (!memberCapacity) {
        errors.push({
          row: rowNumber,
          message: `Capacity data not found for team member: ${teamMember.name}`,
        })
        continue
      }

      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('assignments')
        .select('id, sprints_allocated')
        .eq('project_id', project.id)
        .eq('team_member_id', teamMember.id)
        .eq('quarter', quarter)
        .single()

      if (existingAssignment) {
        // Update existing assignment
        const currentAllocated =
          memberCapacity.allocated - existingAssignment.sprints_allocated
        const newTotal = currentAllocated + assignment.sprintsAllocated

        if (newTotal > 12) {
          warnings.push({
            row: rowNumber,
            message: `Over-allocation warning for ${teamMember.name}: would have ${newTotal}/12 sprints allocated`,
          })
        }

        const { error: updateError } = await supabase
          .from('assignments')
          .update({ sprints_allocated: assignment.sprintsAllocated })
          .eq('id', existingAssignment.id)

        if (updateError) {
          errors.push({
            row: rowNumber,
            message: `Failed to update assignment: ${updateError.message}`,
          })
        } else {
          updated++
          // Update capacity map
          memberCapacity.allocated =
            currentAllocated + assignment.sprintsAllocated
        }
      } else {
        // Create new assignment
        const currentAllocated = memberCapacity.allocated
        const newTotal = currentAllocated + assignment.sprintsAllocated

        if (newTotal > 12) {
          warnings.push({
            row: rowNumber,
            message: `Over-allocation warning for ${teamMember.name}: would have ${newTotal}/12 sprints allocated`,
          })
        }

        const { error: insertError } = await supabase
          .from('assignments')
          .insert({
            project_id: project.id,
            team_member_id: teamMember.id,
            sprints_allocated: assignment.sprintsAllocated,
            quarter,
            notes: null,
          })

        if (insertError) {
          errors.push({
            row: rowNumber,
            message: `Failed to create assignment: ${insertError.message}`,
          })
        } else {
          created++
          // Update capacity map
          memberCapacity.allocated = newTotal
        }
      }
    }
  }

  revalidatePath('/planning')
  revalidatePath('/projects')

  return {
    success: errors.length === 0,
    created,
    updated,
    errors,
    warnings,
  }
}
