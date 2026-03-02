'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SkillTrendsProps {
  skillTrends: Record<string, number>
}

export function SkillTrends({ skillTrends }: SkillTrendsProps) {
  function getTrendIcon(delta: number) {
    if (delta > 0) return <TrendingUp className="h-4 w-4 text-foreground" />
    if (delta < 0) return <TrendingDown className="h-4 w-4 text-muted-foreground" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  function getTrendColor(delta: number) {
    if (delta > 0) return 'text-foreground'
    if (delta < 0) return 'text-muted-foreground'
    return 'text-muted-foreground'
  }

  const hasTrends = Object.values(skillTrends).some(v => v !== 0)

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Skill Trends
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Change since last snapshot</p>
      </div>
      {hasTrends ? (
        <div className="space-y-3">
          {Object.entries(skillTrends)
            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
            .map(([category, delta]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{category}</span>
              <div className={`flex items-center gap-1 ${getTrendColor(delta)}`}>
                {getTrendIcon(delta)}
                <span className="font-semibold">
                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No trend data available. Publish skill snapshots to track changes over time.
        </p>
      )}
    </div>
  )
}
