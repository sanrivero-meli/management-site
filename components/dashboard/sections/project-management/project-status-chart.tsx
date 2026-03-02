'use client'

import { BarChart3 } from 'lucide-react'

interface ProjectStatusChartProps {
  projectsByStatus: Record<string, number>
  totalProjects: number
}

export function ProjectStatusChart({ projectsByStatus, totalProjects }: ProjectStatusChartProps) {
  const statusOrder = ['Planning', 'Active', 'On Hold', 'Complete', 'Cancelled']
  const statusColors: Record<string, string> = {
    Planning: 'bg-informative',
    Active: 'bg-informative',
    'On Hold': 'bg-muted-foreground',
    Complete: 'bg-informative',
    Cancelled: 'bg-destructive',
  }

  const maxCount = Math.max(...Object.values(projectsByStatus), 1)

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Project Status Distribution
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Visual breakdown by status</p>
      </div>
      {totalProjects === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No projects to display</p>
      ) : (
        <div className="space-y-3">
          {statusOrder
            .map((status) => ({
              status,
              count: projectsByStatus[status] || 0,
            }))
            .filter(({ count }) => count > 0)
            .sort((a, b) => b.count - a.count)
            .map(({ status, count }) => {
            const percentage = totalProjects > 0 ? (count / totalProjects) * 100 : 0
            
            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{status}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className={`h-2 rounded-full ${statusColors[status] || 'bg-muted-foreground'} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
