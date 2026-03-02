'use client'

import { TrendingUp } from 'lucide-react'

interface SkillAveragesProps {
  teamSkillAverages: Record<string, number>
}

export function SkillAverages({ teamSkillAverages }: SkillAveragesProps) {
  const categoryColors: Record<string, string> = {
    'Core': 'bg-blue-600',
    'Product Design': 'bg-blue-600',
    'Visual Design': 'bg-blue-600',
    'Content Strategy': 'bg-blue-600',
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Skill Averages by Category
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Average team performance by skill category</p>
      </div>
      {Object.keys(teamSkillAverages).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(teamSkillAverages)
            .sort(([, a], [, b]) => b - a)
            .map(([category, average]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{category}</span>
                <span className="text-lg font-bold">{average.toFixed(1)}/3</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className={`h-2 rounded-full ${categoryColors[category] || 'bg-muted-foreground'}`}
                  style={{ width: `${(average / 3) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No skill data available</p>
      )}
    </div>
  )
}
