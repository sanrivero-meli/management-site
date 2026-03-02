import { getTeamMembers } from '@/app/actions/team'
import { getProjects } from '@/app/actions/projects'
import { getCapacityByQuarter, getAssignments } from '@/app/actions/assignments'
import { PlanningView } from '@/components/planning/planning-view'

function getQuarters() {
  const quarters: string[] = []
  const currentYear = new Date().getFullYear()
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1

  // Generate quarters for current and next year
  for (let year = currentYear; year <= currentYear + 1; year++) {
    for (let q = year === currentYear ? currentQuarter : 1; q <= 4; q++) {
      quarters.push(`Q${q} ${year}`)
    }
  }

  return quarters
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string }>
}) {
  const params = await searchParams
  const selectedQuarter = params.quarter || `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`

  const [teamMembers, projects, capacity, assignments] = await Promise.all([
    getTeamMembers(),
    getProjects(),
    getCapacityByQuarter(selectedQuarter).catch(() => []),
    getAssignments(selectedQuarter).catch(() => []),
  ])

  const quarters = getQuarters()

  return (
    <PlanningView
      teamMembers={teamMembers}
      projects={projects}
      capacity={capacity}
      assignments={assignments}
      quarters={quarters}
      selectedQuarter={selectedQuarter}
    />
  )
}
