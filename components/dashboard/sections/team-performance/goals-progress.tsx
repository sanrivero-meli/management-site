'use client'

import Link from 'next/link'
import { Target } from 'lucide-react'

interface GoalsProgressProps {
  goalsByStatus: Record<string, number>
}

export function GoalsProgress({ goalsByStatus }: GoalsProgressProps) {
  const statusOrder = ['Not Started', 'In Progress', 'Blocked', 'Complete']
  const statusColors: Record<string, string> = {
    'Not Started': 'bg-blue-600',
    'In Progress': 'bg-blue-600',
    'Blocked': 'bg-muted-foreground',
    'Complete': 'bg-blue-600',
  }

  const totalGoals = Object.values(goalsByStatus).reduce((sum, count) => sum + count, 0)
  const completedGoals = goalsByStatus['Complete'] || 0
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Goals Progress
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {totalGoals} total goal{totalGoals !== 1 ? 's' : ''} • {completionRate.toFixed(0)}% complete
        </p>
      </div>
      {totalGoals === 0 ? (
        <p className="text-sm text-muted-foreground">No goals tracked yet</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {statusOrder
              .map((status) => ({
                status,
                count: goalsByStatus[status] || 0,
              }))
              .filter(({ count }) => count > 0)
              .sort((a, b) => b.count - a.count)
              .map(({ status, count }) => {
              const percentage = totalGoals > 0 ? (count / totalGoals) * 100 : 0
              
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
          <div className="pt-2">
            <Link href="/team" className="text-sm text-blue-600 hover:underline font-medium">
              View all goals →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
