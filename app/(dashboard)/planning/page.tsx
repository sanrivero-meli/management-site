import {
  getTeamWithSkills,
  getQuarterAssignments,
  getQuarterCapacity,
  getProjectsForPlanning,
  getAllPerformanceHistory,
  getAllInfluenceRelationships,
} from '@/app/actions/planning'
import { PlanningPageClient } from '@/components/planning/planning-page-client'
import type { MemberPerformanceProject } from '@/types'

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const currentQuarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
  const quarter = params.quarter || currentQuarter

  const [teamWithSkills, assignments, capacity, projects, performanceHistory, influenceMap] = await Promise.all([
    getTeamWithSkills(),
    getQuarterAssignments(quarter),
    getQuarterCapacity(quarter),
    getProjectsForPlanning(),
    getAllPerformanceHistory(),
    getAllInfluenceRelationships(),
  ])

  // Serialize Maps to plain objects for client component
  const performanceHistorySerialized: Record<string, MemberPerformanceProject[]> = {}
  performanceHistory.forEach((value, key) => {
    performanceHistorySerialized[key] = value
  })

  const influenceMapSerialized: Record<string, Record<string, number>> = {}
  influenceMap.forEach((targets, source) => {
    influenceMapSerialized[source] = {}
    targets.forEach((level, target) => {
      influenceMapSerialized[source][target] = level
    })
  })

  return (
    <PlanningPageClient
      quarter={quarter}
      teamWithSkills={teamWithSkills}
      assignments={assignments}
      capacity={capacity}
      projects={projects}
      performanceHistory={performanceHistorySerialized}
      influenceMap={influenceMapSerialized}
    />
  )
}
