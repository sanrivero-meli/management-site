'use client'

import { AlertBanner } from './alert-banner'
import { ActiveProjectsCard } from './sections/project-management/active-projects-card'
import { UpcomingDeadlines } from './sections/project-management/upcoming-deadlines'
import { CapacityGauge } from './sections/project-management/capacity-gauge'
import { ProjectStatusChart } from './sections/project-management/project-status-chart'
import { SkillAverages } from './sections/team-performance/skill-averages'
import { SkillTrends } from './sections/team-performance/skill-trends'
import { GoalsProgress } from './sections/team-performance/goals-progress'
import { FeedbackInsights } from './sections/team-performance/feedback-insights'
import { MotivationHeatmap } from './sections/team-health/motivation-heatmap'
import { MemberQuickStatus } from './sections/team-health/member-quick-status'
import { InfluenceSummary } from './sections/team-health/influence-summary'

interface DashboardMetricsProps {
  metrics: {
    capacityUtilization: number
    projectsByStatus: Record<string, number>
    goalsAtRisk: number
    avgMotivation: number
    influenceDistribution: Record<number, number>
    influenceRelationships: {
      members: string[]
      memberIds: string[]
      matrix: number[][]
    }
    totalProjects: number
    teamSkillAverages: Record<string, number>
    // New metrics
    upcomingDeadlines: Array<{ id: string; name: string; end_date: string; status: string }>
    overdueProjects: Array<{ id: string; name: string; end_date: string }>
    overallocatedMembers: Array<{ name: string; allocated: number; capacity: number }>
    goalsByStatus: Record<string, number>
    skillTrends: Record<string, number>
    feedbackSkillHighlights: Array<{ skill: string; count: number }>
    feedbackSkillImprovements: Array<{ skill: string; count: number }>
    memberMotivations: Array<{ id: string; name: string; motivation_level: number }>
    lowMotivationMembers: Array<{ id: string; name: string; motivation_level: number }>
  }
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <AlertBanner
        goalsAtRisk={metrics.goalsAtRisk}
        lowMotivationMembers={metrics.lowMotivationMembers}
        overdueProjects={metrics.overdueProjects}
      />

      {/* Three-Column Semantic Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Management Column */}
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-semibold text-foreground">Project Management</h2>
            <p className="text-sm text-muted-foreground">Delivery health and resource allocation</p>
          </div>
          <ActiveProjectsCard
            totalProjects={metrics.totalProjects}
            projectsByStatus={metrics.projectsByStatus}
          />
          <UpcomingDeadlines upcomingDeadlines={metrics.upcomingDeadlines} />
          <CapacityGauge
            capacityUtilization={metrics.capacityUtilization}
            overallocatedMembers={metrics.overallocatedMembers}
          />
          <ProjectStatusChart
            projectsByStatus={metrics.projectsByStatus}
            totalProjects={metrics.totalProjects}
          />
        </div>

        {/* Team Performance Column */}
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-semibold text-foreground">Team Performance</h2>
            <p className="text-sm text-muted-foreground">Skills development and goal achievement</p>
          </div>
          <SkillAverages teamSkillAverages={metrics.teamSkillAverages} />
          <SkillTrends skillTrends={metrics.skillTrends} />
          <GoalsProgress goalsByStatus={metrics.goalsByStatus} />
          <FeedbackInsights
            feedbackSkillHighlights={metrics.feedbackSkillHighlights}
            feedbackSkillImprovements={metrics.feedbackSkillImprovements}
          />
        </div>

        {/* Team Health Column */}
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-semibold text-foreground">Team Health</h2>
            <p className="text-sm text-muted-foreground">Team wellness and collaboration</p>
          </div>
          <MotivationHeatmap
            memberMotivations={metrics.memberMotivations}
            avgMotivation={metrics.avgMotivation}
          />
          <MemberQuickStatus
            memberMotivations={metrics.memberMotivations}
            teamSkillAverages={metrics.teamSkillAverages}
          />
          <InfluenceSummary influenceRelationships={metrics.influenceRelationships} />
        </div>
      </div>
    </div>
  )
}
