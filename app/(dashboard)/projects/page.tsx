import { getProjects } from '@/app/actions/projects'
import { ProjectsPageClient } from '@/components/projects/projects-page-client'

type SortOption = 'name' | 'status' | 'priority' | 'start_date' | 'end_date' | 'created_at' | 'estimated'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    priority?: string
    category?: string
    squad?: string
    tags?: string
    product_owner?: string
    owners?: string
    search?: string
    sort?: string
    order?: string
  }>
}) {
  const params = await searchParams
  const allProjects = await getProjects()
  const sortBy = (params.sort as SortOption) || 'name'
  const order = params.order || 'asc'
  
  // Parse comma-separated filter values
  function parseFilterParam(param: string | undefined): string[] {
    if (!param) return []
    return param.split(',').filter(Boolean)
  }

  const statusFilters = parseFilterParam(params.status)
  const priorityFilters = parseFilterParam(params.priority)
  const categoryFilters = parseFilterParam(params.category)
  const squadFilters = parseFilterParam(params.squad)
  const tagFilters = parseFilterParam(params.tags)
  const productOwnerFilters = parseFilterParam(params.product_owner)
  const ownersFilters = parseFilterParam(params.owners)
  
  // Filter projects - AND logic across categories, OR logic within each category
  let projects = allProjects
  
  // Status filter (OR logic: project matches any selected status)
  if (statusFilters.length > 0) {
    projects = projects.filter((p) => statusFilters.includes(p.status))
  }
  
  // Priority filter (OR logic: project matches any selected priority)
  if (priorityFilters.length > 0) {
    projects = projects.filter((p) => 
      p.priority !== null && priorityFilters.includes(p.priority)
    )
  }
  
  // Category filter (OR logic: project matches any selected category)
  if (categoryFilters.length > 0) {
    projects = projects.filter((p) => 
      p.category !== null && categoryFilters.includes(p.category)
    )
  }
  
  // Squad filter (OR logic: project matches any selected squad)
  if (squadFilters.length > 0) {
    projects = projects.filter((p) => 
      p.squad !== null && squadFilters.includes(p.squad)
    )
  }
  
  // Tags filter (OR logic: project has any selected tag)
  if (tagFilters.length > 0) {
    projects = projects.filter((p) => 
      p.tags !== null && p.tags.length > 0 && 
      tagFilters.some(tag => p.tags!.includes(tag as any))
    )
  }
  
  // Product Owner filter (OR logic: project matches any selected owner)
  if (productOwnerFilters.length > 0) {
    projects = projects.filter((p) => 
      p.product_owner !== null && productOwnerFilters.includes(p.product_owner)
    )
  }
  
  // Owners filter (OR logic: project has any selected owner in owners array)
  if (ownersFilters.length > 0) {
    projects = projects.filter((p) => 
      p.owners !== null && p.owners.length > 0 && 
      ownersFilters.some(ownerId => p.owners!.includes(ownerId))
    )
  }
  
  // Search filter (searches in name, description, and scope)
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.scope?.toLowerCase().includes(searchLower)
    )
  }

  // Sort projects
  projects.sort((a, b) => {
    let aValue: string | number | null
    let bValue: string | number | null
    let comparison = 0

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'priority':
        // Priority order: HIT > Carryover > BAU > World Class > Wishlist > Quality
        const priorityOrder: Record<string, number> = {
          'HIT': 6,
          'Carryover': 5,
          'BAU': 4,
          'World Class': 3,
          'Wishlist': 2,
          'Quality': 1,
        }
        const aPriorityOrder = a.priority ? priorityOrder[a.priority] ?? 0 : 0
        const bPriorityOrder = b.priority ? priorityOrder[b.priority] ?? 0 : 0
        comparison = aPriorityOrder - bPriorityOrder
        return order === 'desc' ? -comparison : comparison
      case 'start_date':
        aValue = a.start_date ? new Date(a.start_date).getTime() : null
        bValue = b.start_date ? new Date(b.start_date).getTime() : null
        break
      case 'end_date':
        aValue = a.end_date ? new Date(a.end_date).getTime() : null
        bValue = b.end_date ? new Date(b.end_date).getTime() : null
        break
      case 'created_at':
        aValue = a.created_at ? new Date(a.created_at).getTime() : null
        bValue = b.created_at ? new Date(b.created_at).getTime() : null
        break
      case 'estimated':
        aValue = a.estimated ?? null
        bValue = b.estimated ?? null
        break
      default:
        return 0
    }

    // Handle null values - sort them to the end
    if (aValue === null && bValue === null) return 0
    if (aValue === null) return 1
    if (bValue === null) return -1

    // Compare values
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    }

    return order === 'desc' ? -comparison : comparison
  })

  return <ProjectsPageClient projects={projects} />
}
