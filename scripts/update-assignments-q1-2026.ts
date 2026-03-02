/**
 * Script to bulk update project assignments for Q1 2026
 * 
 * Usage:
 *   npx tsx scripts/update-assignments-q1-2026.ts
 * 
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Assignment data from user input
const ASSIGNMENTS_DATA = `Banco de Mexico	1	Fê	0,25	1,25		
[MLB] Collateral - FGBS	4	Pris	4	8	Patri	
[Linea Seller] Convivencia con PPV	2	Max	3,5	5,5		
[Carry Over] [Roll Out] - Aceptación del débito automático del usuario en cada apertura de cuenta + Update CCB	0,5	Max	0,25	0,75	Patri	
[Cross-segment] Línea Seller MLA - Preparación de los CHOs para cobros de IDC	0,25	Fê	0	0,25		
Convivencia de Productos - Originación y Awareness	5	Pris		5		
Convivencia de Productos - Transición de Buyers a Sellers	5	Max		5		
[DE] Tasa 0 - Tasa por Plazo	0,25	Pris	0,25	0,5		
[Carry Over]  [MLB] Continuación desarrollo Migración a Flox PPV	0,25	Max	0,25	0,5	Patri	
Adelantos: Contextualización de restricciones de riesgo bajo	1	Pris	1,25	2,25		
[ALL] Qualtrics en Admin	0,25	Max	0,25	0,5	Patri	
Desarrollo Prestamista en Linea Seller	0,25	Fê	0,25	0,5		
Integración Nuevos Niveles de Validación KYC (Nivel 6 Reforzado y Nivel 7)	2,5	Fê	2	4,5	Patri	
[Desarrollo] Adelantos en Commerce - Ventas L2 	1	Fê	0,25	1,25		
[Desarrollo] Adelantos en Commerce - Ventas L1	1	Fê	0,25	1,25		
Launch Adelantos MLC	0	Fê	2,25	2,25		
[Commerce] Iteración Card Credits en Summary	0,25	Max	0,5	0,75	Patri	
[Calidad] Migración a Andes X - Nativo	1	Max	0,5	1,5		
[Calidad] Migración a Andes X - Desktop	1	Pris	0,5	1,5		
[Linea Seller] Mejoras técnicas post Roll - Out 	2	Max	1,5	3,5	Patri	
[Adelantos] Adaptaciones para poder ofrecer Fee 0%	0,5	Fê	0,5	1		
[Renova] Experiencia de Renova en Admin Credits	2	Max	1,5	3,5	Patri	
[Linea Seller] Seleccion fecha de vencimiento desde Simulador		Max		0		
[Commerce] Sumar Optin en Seller Asistant		Fê		0		
[Adelantos] Mejoras post Rollout	0,25	Fê	1,5	1,75		
[Línea Seller] Habilitar Línea seller en xsells de Merchants				0		
https://mercadolibre.atlassian.net/browse/PRCRED-62100				0		
Aprobaciones y Activación de políticas	1	Fê		1		
ITERACIONES EOC: Evoluciones - Módulo de Políticas	2	Fê		2		
Tasas en las Campañas de CC	1,25	Fê		1,25		
Políticas de Impacto por Excepción desde EOC		Fê		0		
FUNCIONALIDAD EOC: Sistema de Alertas en tiempo pré encendido	2,5	Fê		2,5		
[Strategy] Conversión Simulaciónes a Campañas	1,25	Fê		1,25		
Reglas y Killer - Incorporar Date Picker	0,25	Fê		0,25		
Campos Obligatorios y Default en Politicas	0,75	Fê		0,75		
Condensador de Flujos - Implementación	0,25	Fê		0,25		
Impactos en Banco de México	0,25	Fê		0,25		
Multi Scoring	0,25	Fê		0,25		`

const QUARTER = 'Q1 2026'

// Import the bulk update function logic
// Since we can't import server actions directly, we'll use the Supabase client
// and replicate the necessary logic here

// Helper functions (copied from assignments.ts)
function normalizeProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function findProjectByName(
  projects: Array<{ id: string; name: string }>,
  searchName: string
): { id: string; name: string } | null {
  const normalizedSearch = normalizeProjectName(searchName)
  
  const exactMatch = projects.find(
    (p) => normalizeProjectName(p.name) === normalizedSearch
  )
  if (exactMatch) return exactMatch

  const caseInsensitiveMatch = projects.find(
    (p) => p.name.toLowerCase().trim() === searchName.toLowerCase().trim()
  )
  if (caseInsensitiveMatch) return caseInsensitiveMatch

  const partialMatch = projects.find(
    (p) =>
      normalizeProjectName(p.name).includes(normalizedSearch) ||
      normalizedSearch.includes(normalizeProjectName(p.name))
  )
  if (partialMatch) return partialMatch

  return null
}

function findTeamMemberByName(
  teamMembers: Array<{ id: string; name: string }>,
  shortName: string
): { id: string; name: string } | null {
  const normalizedSearch = shortName.trim().toLowerCase()
  
  const exactMatch = teamMembers.find(
    (m) => m.name.toLowerCase().trim() === normalizedSearch
  )
  if (exactMatch) return exactMatch

  const partialMatch = teamMembers.find(
    (m) => m.name.toLowerCase().includes(normalizedSearch)
  )
  if (partialMatch) return partialMatch

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

function parseDecimal(value: string | null | undefined): number | null {
  if (!value || value.trim() === '' || value === '-') return null
  const normalized = value.trim().replace(',', '.')
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? null : parsed
}

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

  const knownNames = ['fê', 'fé', 'pris', 'max', 'patri']

  for (const line of lines) {
    const columns = line.split('\t').map((col) => col.trim())
    
    if (columns.length < 4) continue

    const projectName = columns[0]
    const estimated = parseDecimal(columns[1])
    const person1 = columns[2]
    const sprints1 = parseDecimal(columns[3])
    
    if (!projectName) continue

    const assignments: Array<{ personName: string; sprintsAllocated: number }> = []

    if (person1 && sprints1 !== null && sprints1 > 0) {
      assignments.push({
        personName: person1,
        sprintsAllocated: Math.round(sprints1),
      })
    }

    for (let i = 4; i < columns.length; i++) {
      const col = columns[i]
      if (!col || col === '') continue
      
      const normalizedCol = col.toLowerCase().trim()
      const asNumber = parseDecimal(col)
      const isPersonName = asNumber === null && knownNames.some(name => 
        normalizedCol === name || normalizedCol.includes(name) || name.includes(normalizedCol)
      )
      
      if (isPersonName) {
        const person2 = col
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
        
        if (sprints2 !== null && sprints2 > 0) {
          assignments.push({
            personName: person2,
            sprintsAllocated: Math.round(sprints2),
          })
        }
        break
      }
    }

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

async function updateAssignmentsQ1_2026() {
  console.log('Starting bulk assignment update for Q1 2026...')
  console.log('='.repeat(60))

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
    console.error('Failed to fetch projects:', projectsResult.error.message)
    process.exit(1)
  }

  if (teamMembersResult.error) {
    console.error('Failed to fetch team members:', teamMembersResult.error.message)
    process.exit(1)
  }

  const projects = projectsResult.data || []
  const teamMembers = teamMembersResult.data || []

  // Get current capacity for the quarter
  const { data: assignmentsData } = await supabase
    .from('assignments')
    .select('team_member_id, sprints_allocated')
    .eq('quarter', QUARTER)

  const capacityMap = new Map<string, { allocated: number }>()
  teamMembers.forEach((member) => {
    const memberAssignments = (assignmentsData || []).filter(
      (a) => a.team_member_id === member.id
    )
    const allocated = memberAssignments.reduce(
      (sum, a) => sum + a.sprints_allocated,
      0
    )
    capacityMap.set(member.id, { allocated })
  })

  // Parse the input data
  const parsedData = parseAssignmentData(ASSIGNMENTS_DATA)

  // Process each parsed row
  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i]
    const rowNumber = i + 1

    const project = findProjectByName(projects, row.projectName)
    if (!project) {
      errors.push({
        row: rowNumber,
        message: `Project not found: "${row.projectName}"`,
      })
      continue
    }

    for (const assignment of row.assignments) {
      const teamMember = findTeamMemberByName(teamMembers, assignment.personName)
      if (!teamMember) {
        errors.push({
          row: rowNumber,
          message: `Team member not found: "${assignment.personName}"`,
        })
        continue
      }

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
        .eq('quarter', QUARTER)
        .single()

      if (existingAssignment) {
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
          memberCapacity.allocated = newTotal
        }
      } else {
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
            quarter: QUARTER,
            notes: null,
          })

        if (insertError) {
          errors.push({
            row: rowNumber,
            message: `Failed to create assignment: ${insertError.message}`,
          })
        } else {
          created++
          memberCapacity.allocated = newTotal
        }
      }
    }
  }

  console.log('\nResults:')
  console.log(`  Success: ${errors.length === 0 ? 'Yes' : 'No'}`)
  console.log(`  Created: ${created} assignments`)
  console.log(`  Updated: ${updated} assignments`)
  console.log(`  Errors: ${errors.length}`)
  console.log(`  Warnings: ${warnings.length}`)

  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach((error) => {
      console.log(`  Row ${error.row}: ${error.message}`)
    })
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:')
    warnings.forEach((warning) => {
      console.log(`  Row ${warning.row}: ${warning.message}`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('Bulk update completed!')

  return {
    success: errors.length === 0,
    created,
    updated,
    errors,
    warnings,
  }
}

// Run the script
updateAssignmentsQ1_2026()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
