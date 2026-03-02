'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export async function getProjects() {
  const supabase = await createClient()
  
  // Fetch projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('name')

  if (projectsError) {
    throw new Error(`Failed to fetch projects: ${projectsError.message}`)
  }

  // Fetch all assignments with team member names
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      project_id,
      team_member_id,
      team_members:team_member_id (
        id,
        name
      )
    `)

  if (assignmentsError) {
    throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`)
  }

  // Group assignments by project_id
  const assignmentsByProject = (assignments || []).reduce((acc, assignment) => {
    if (!acc[assignment.project_id]) {
      acc[assignment.project_id] = []
    }
    if (assignment.team_members) {
      acc[assignment.project_id].push({
        id: assignment.team_member_id,
        team_member_id: assignment.team_member_id,
        team_members: assignment.team_members as unknown as { id: string; name: string }
      })
    }
    return acc
  }, {} as Record<string, Array<{
    id: string
    team_member_id: string
    team_members: { id: string; name: string }
  }>>)

  // Merge assignments into projects
  return (projects || []).map(project => ({
    ...project,
    assignments: assignmentsByProject[project.id] || []
  })) as (Project & {
    assignments: Array<{
      id: string
      team_member_id: string
      team_members: { id: string; name: string }
    }>
  })[]
}

export async function getProject(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch project: ${error.message}`)
  }

  return data as Project
}

export async function createProject(formData: FormData) {
  const supabase = await createClient()

  const startDate = formData.get('start_date') as string || null
  const endDate = formData.get('end_date') as string || null
  const estimatedStr = formData.get('estimated') as string || null
  const tagsStr = formData.get('tags') as string || null
  const ownersStr = formData.get('owners') as string || null

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    scope: formData.get('scope') as string || null,
    jira_link: formData.get('jira_link') as string || null,
    status: (formData.get('status') as Project['status']) || 'Planning',
    priority: formData.get('priority') as string || null,
    category: formData.get('category') as string || null,
    squad: formData.get('squad') as string || null,
    tags: tagsStr ? JSON.parse(tagsStr) : [],
    owners: ownersStr ? JSON.parse(ownersStr) : [],
    product_owner: formData.get('product_owner') as string || null,
    start_date: startDate || null,
    end_date: endDate || null,
    estimated: estimatedStr ? parseFloat(estimatedStr) : null,
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/projects')
  return { data: project }
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient()

  const data: Partial<Project> = {}
  
  const name = formData.get('name')
  const description = formData.get('description')
  const scope = formData.get('scope')
  const jira_link = formData.get('jira_link')
  const status = formData.get('status')
  const priority = formData.get('priority')
  const category = formData.get('category')
  const squad = formData.get('squad')
  const tagsStr = formData.get('tags')
  const ownersStr = formData.get('owners')
  const product_owner = formData.get('product_owner')
  const startDate = formData.get('start_date')
  const endDate = formData.get('end_date')
  const estimatedStr = formData.get('estimated')

  if (name) data.name = name as string
  if (description !== null) data.description = description as string | null
  if (scope !== null) data.scope = scope as string | null
  if (jira_link !== null) data.jira_link = jira_link as string | null
  if (status) data.status = status as Project['status']
  if (priority !== null) data.priority = ((priority as string) || null) as Project['priority']
  if (category !== null) data.category = ((category as string) || null) as Project['category']
  if (squad !== null) data.squad = ((squad as string) || null) as Project['squad']
  if (tagsStr !== null) data.tags = tagsStr ? JSON.parse(tagsStr as string) : []
  if (ownersStr !== null) data.owners = ownersStr ? JSON.parse(ownersStr as string) : []
  if (product_owner !== null) data.product_owner = ((product_owner as string) || null) as Project['product_owner']
  if (startDate !== null) data.start_date = startDate as string | null
  if (endDate !== null) data.end_date = endDate as string | null
  if (estimatedStr !== null) {
    const estimated = estimatedStr ? parseFloat(estimatedStr as string) : null
    data.estimated = estimated
  }

  const { error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return { success: true }
}

export async function deleteProject(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/projects')
  return { success: true }
}

// Helper function to parse date format "DD-M" to "YYYY-MM-DD"
function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return null
  
  const parts = dateStr.split('-')
  if (parts.length !== 2) return null
  
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  
  if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) {
    return null
  }
  
  // Assuming year 2025
  const year = 2025
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

// Helper function to map status
function mapStatus(status: string): Project['status'] {
  const statusMap: Record<string, Project['status']> = {
    'In Progress': 'Doing',
    'To Do': 'To Do',
    'Done': 'Done',
  }
  return statusMap[status] || 'Planning'
}

// Bulk import initiatives
export async function bulkImportInitiatives() {
  const supabase = await createClient()

  const initiatives = [
    {
      name: 'Banco de Mexico',
      scope: 'Obtención de la licencia bancaria en México (convertir la licencia IFPE en IBM).',
      status: 'Active' as const,
      estimated: 1.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: '[Carry Over] [Roll Out] - Aceptación del débito automático del usuario en cada apertura de cuenta + Update CCB',
      scope: 'Soporte al rollout',
      status: 'Active' as const,
      estimated: 0.75,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: '[Cross-segment] Línea Seller MLA - Preparación de los CHOs para cobros de IDC',
      scope: 'Traer concepto IDC en summaries de MLA',
      status: 'Active' as const,
      estimated: 0.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('16-1'),
    },
    {
      name: '[MLB] Collateral - FGBS',
      scope: 'Asociación con el BNDES para el lanzamiento del FGBS (Fondo Garantidor BNDES-Sebrae), mediante el cual MP ofrece creditos con una garantía de hasta 80% del valor del crédito, con un stop-loss del 8% sobre la cartera, para usuarios PJ. El crédito operará como fondeo único (no se permiten dos créditos simultáneos; el seller podrá solicitar otro una vez cancelado el anterior), similar a Cuota Fija, pero con condiciones mejoradas. Desarrollos requeridos: -Integración con el proveedor para originar créditos, pagar el fee de originación y gestionar el reclamo de la garantía. -Implementación del flujo de opt-in y originación para usuarios. -Inclusión del fee de originación en la tasa del crédito. -Ajustes en modelos contables y procesos de cobranza para habilitar la ejecución del collateral. -(Opcional) Período de carencia de 3 meses, actualmente exigido por el BNDES, que podría eliminarse próximamente.',
      status: 'Active' as const,
      estimated: 8,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Convivencia de Productos - Originación y Awareness',
      scope: '',
      status: 'Active' as const,
      estimated: 5,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Convivencia de Productos - Transición de Buyers a Sellers',
      scope: '',
      status: 'Active' as const,
      estimated: 5,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: '[Linea Seller] Convivencia con PPV',
      scope: 'Poder tener convivencia de ofertas, reglas y flujos de originación entre PPV con Linea Seller. Actualmente el Admin donde se visualiza LS no soporta la convivencia.',
      status: 'Active' as const,
      estimated: 5.5,
      start_date: parseDate('05-1'),
      end_date: parseDate('30-1'),
    },
    {
      name: '[DE] Tasa 0 - Tasa por Plazo',
      scope: 'Generar capability de Tasa por Plazo para poder ofrecer tasa 0% a 7 días. Adecuar experiencia y triggers para ofrecer el beneficio a los usuarios correspondientes.',
      status: 'Active' as const,
      estimated: 0.5,
      start_date: parseDate('05-1'),
      end_date: parseDate('13-2'),
    },
    {
      name: '[Carry Over] [MLB] Continuación desarrollo Migración a Flox PPV',
      scope: 'Migración a FLOX para posteriormente poder implementar las propuestas de mejoras en los simuladores de PPV.',
      status: 'Active' as const,
      estimated: 0.5,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Adelantos: Contextualización de restricciones de riesgo bajo',
      scope: 'Contextualizar en el admin de adelantos ante la aplicación de una restricción de riesgo bajo que imposibilita a los sellers de adelantar ventas no despachadas.',
      status: 'Planning' as const,
      estimated: 2.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Desarrollo Prestamista en Linea Seller',
      scope: '',
      status: 'Active' as const,
      estimated: 0.5,
      start_date: parseDate('20-1'),
      end_date: parseDate('13-3'),
    },
    {
      name: 'Integración Nuevos Niveles de Validación KYC (Nivel 6 Reforzado y Nivel 7)',
      scope: 'Solo PF. PJ TBD.',
      status: 'Active' as const,
      estimated: 4.5,
      start_date: parseDate('05-1'),
      end_date: parseDate('27-2'),
    },
    {
      name: '[Desarrollo] Adelantos en Commerce - Ventas L2',
      scope: 'Desarrollo de nuevo cross sell de Adelantos en la pantalla de detalle de Ventas',
      status: 'Planning' as const,
      estimated: 1.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: '[Desarrollo] Adelantos en Commerce - Ventas L1',
      scope: 'Desarrollo de nuevo cross sell de Adelantos en la pantalla principal de Ventas',
      status: 'Planning' as const,
      estimated: 1.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: '[Commerce] Iteración Card Credits en Summary',
      scope: 'Desarrollo de nuevos casos de uso: Cobranza, Mora, TC. Preparacion del componente para consumir Score Numerico.',
      status: 'Active' as const,
      estimated: 0.75,
      start_date: parseDate('02-2'),
      end_date: parseDate('06-3'),
    },
    {
      name: '[Calidad] Migración a Andes X - Nativo',
      scope: 'Migración de flujos nativos a Andes X, UX + comienzo desarrollo',
      status: 'Active' as const,
      estimated: 1.5,
      start_date: parseDate('05-1'),
      end_date: parseDate('30-1'),
    },
    {
      name: '[Calidad] Migración a Andes X - Desktop',
      scope: 'Migración de flujos Desktop a Andes X, UX + comienzo desarrollo',
      status: 'Active' as const,
      estimated: 1.5,
      start_date: parseDate('05-1'),
      end_date: parseDate('13-2'),
    },
    {
      name: '[Linea Seller] Mejoras técnicas post Roll - Out',
      scope: '',
      status: 'Planning' as const,
      estimated: 3.5,
      start_date: parseDate('03-2'),
      end_date: parseDate('31-3'),
    },
    {
      name: '[Adelantos] Adaptaciones para poder ofrecer Fee 0%',
      scope: 'Contexto: El 35% de los usuarios Xsite que adelantan por primera vez repiten en los posteriores 30 días. Dada la alta tasa de repetición post primer adelanto se está impulsando xsite campañas de descuento de pricing para que el usuario pruebe el producto. Descripción iniciativa: Buscamos poder ofrecerle a los users la posibilidad de hacer adelantos a fee 0%. Actualmente el producto tiene la limitante de que los fees tienen que ser > 0, como control.',
      status: 'Planning' as const,
      estimated: 1,
      start_date: parseDate('09-1'),
      end_date: parseDate('23-1'),
    },
    {
      name: '[Renova] Experiencia de Renova en Admin Credits',
      scope: 'Diseño de experiencia de Renova en el Admin de Credits for Sellers.',
      status: 'Planning' as const,
      estimated: 3.5,
      start_date: parseDate('02-2'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'FUNCIONALIDADE EOC: Grupos de Control',
      scope: 'Fase 4! Poder argar grupos en base a 1 o mas variables (fase 2 2.0 o fase 4 mas complejidad)',
      status: 'Active' as const,
      estimated: 0.5,
      start_date: null,
      end_date: null,
    },
    {
      name: 'ITERACIONES EOC: Evoluciones - Módulo de Políticas',
      scope: 'Poder calcular con fórmulas simples, de lógica, además de crear flujos de condiciones dentro del EOC.',
      status: 'Active' as const,
      estimated: 2,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: '[Strategy] Conversión Simulaciónes a Campañas',
      scope: 'Desarrollar la capacidad de "Convertir a Campaña" y viceversa, es decir "Campaña a Simulación"',
      status: 'Planning' as const,
      estimated: 1.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Reglas y Killer - Incorporar Date Picker',
      scope: 'Implementación de la feature, acompañamiento.',
      status: 'Active' as const,
      estimated: 0.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Campos Obligatorios y Default en Politicas',
      scope: 'Robustecer la interfaz (UX) para guiar al usuario. Al forzar la carga de datos obligatorios y transparentar los valores default, reducimos drásticamente el error humano y aseguramos que lo que se configura es exactamente lo que se ejecuta.',
      status: 'Planning' as const,
      estimated: 0.75,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Condensador de Flujos - Implementación',
      scope: 'Soporte',
      status: 'Active' as const,
      estimated: 0.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Impactos en Banco de México',
      scope: 'Análisis para identificar impactos',
      status: 'Planning' as const,
      estimated: 0.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
    {
      name: 'Multi Scoring',
      scope: 'Desarrollo',
      status: 'Active' as const,
      estimated: 0.25,
      start_date: parseDate('05-1'),
      end_date: parseDate('31-3'),
    },
  ]

  const { data, error } = await supabase
    .from('projects')
    .insert(initiatives)
    .select()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/projects')
  return { data, count: data.length }
}

// Bulk import projects and assignments from tab-separated data
// Format: PROJECT | Owner 1 | Sprints | Owner 2 | Sprints
export async function bulkImportProjectsAndAssignments(
  data: string,
  quarter: string
): Promise<{
  success: boolean
  projectsCreated: number
  assignmentsCreated: number
  errors: Array<{ row: number; message: string }>
}> {
  const supabase = await createClient()
  const errors: Array<{ row: number; message: string }> = []
  let projectsCreated = 0
  let assignmentsCreated = 0

  // Fetch all projects and team members
  const [projectsResult, teamMembersResult] = await Promise.all([
    supabase.from('projects').select('id, name'),
    supabase.from('team_members').select('id, name'),
  ])

  if (projectsResult.error) {
    return {
      success: false,
      projectsCreated: 0,
      assignmentsCreated: 0,
      errors: [{ row: 0, message: `Failed to fetch projects: ${projectsResult.error.message}` }],
    }
  }

  if (teamMembersResult.error) {
    return {
      success: false,
      projectsCreated: 0,
      assignmentsCreated: 0,
      errors: [{ row: 0, message: `Failed to fetch team members: ${teamMembersResult.error.message}` }],
    }
  }

  const projects = projectsResult.data || []
  const teamMembers = teamMembersResult.data || []

  // Helper to normalize project names
  function normalizeProjectName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ').trim()
  }

  // Helper to find project by name
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

  // Helper to find team member by short name
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
      'fê': ['fé', 'fernanda'],
      'fé': ['fê', 'fernanda'],
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

  // Helper to parse decimal (handles comma format)
  function parseDecimal(value: string | null | undefined): number | null {
    if (!value || value.trim() === '' || value === '-') return null
    const normalized = value.trim().replace(',', '.')
    const parsed = parseFloat(normalized)
    return isNaN(parsed) ? null : parsed
  }

  // Parse data
  const lines = data.split('\n').filter((line) => line.trim() !== '')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const rowNumber = i + 1
    const columns = line.split('\t').map((col) => col.trim())

    // Skip header row or empty rows
    if (columns.length < 3 || columns[0].toLowerCase() === 'project') continue

    const projectName = columns[0]
    const owner1 = columns[1]
    const sprints1 = parseDecimal(columns[2])
    const owner2 = columns[3] || null
    const sprints2 = parseDecimal(columns[4] || null)

    if (!projectName) continue

    // Find or create project
    let project = findProjectByName(projects, projectName)
    
    if (!project) {
      // Create new project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          status: 'Planning',
          description: null,
          scope: null,
          jira_link: null,
        })
        .select()
        .single()

      if (projectError) {
        errors.push({
          row: rowNumber,
          message: `Failed to create project "${projectName}": ${projectError.message}`,
        })
        continue
      }

      project = newProject
      if (project) {
        projects.push(project)
        projectsCreated++
      }
    }

    if (!project) continue

    // Create assignment for Owner 1
    if (owner1 && sprints1 !== null && sprints1 > 0) {
      const teamMember1 = findTeamMemberByName(teamMembers, owner1)
      if (!teamMember1) {
        errors.push({
          row: rowNumber,
          message: `Team member not found: "${owner1}"`,
        })
      } else {
        const { error: assignError } = await supabase
          .from('assignments')
          .insert({
            project_id: project.id,
            team_member_id: teamMember1.id,
            sprints_allocated: sprints1,
            quarter,
            notes: null,
          })

        if (assignError) {
          errors.push({
            row: rowNumber,
            message: `Failed to create assignment for ${owner1}: ${assignError.message}`,
          })
        } else {
          assignmentsCreated++
        }
      }
    }

    // Create assignment for Owner 2
    if (owner2 && sprints2 !== null && sprints2 > 0) {
      const teamMember2 = findTeamMemberByName(teamMembers, owner2)
      if (!teamMember2) {
        errors.push({
          row: rowNumber,
          message: `Team member not found: "${owner2}"`,
        })
      } else {
        const { error: assignError } = await supabase
          .from('assignments')
          .insert({
            project_id: project.id,
            team_member_id: teamMember2.id,
            sprints_allocated: sprints2,
            quarter,
            notes: null,
          })

        if (assignError) {
          errors.push({
            row: rowNumber,
            message: `Failed to create assignment for ${owner2}: ${assignError.message}`,
          })
        } else {
          assignmentsCreated++
        }
      }
    }
  }

  revalidatePath('/projects')
  revalidatePath('/planning')

  return {
    success: errors.length === 0,
    projectsCreated,
    assignmentsCreated,
    errors,
  }
}
