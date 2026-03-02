'use client'

import { ResponsiveChord } from '@nivo/chord'
import { INFLUENCE_LABELS } from '@/types'

interface InfluenceChordChartProps {
  members: string[]
  matrix: number[][]
}

// Color palette matching the existing design system
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

export function InfluenceChordChart({ members, matrix }: InfluenceChordChartProps) {
  // Handle edge cases
  if (!members || members.length < 2) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
        {members.length === 0
          ? 'No team members to display'
          : 'Need at least 2 team members to show influence relationships'}
      </div>
    )
  }

  // Check if there are any relationships
  const hasRelationships = matrix.some((row) => row.some((val) => val > 0))

  if (!hasRelationships) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-sm text-muted-foreground">
        <p className="mb-2">No influence relationships defined yet</p>
        <p className="text-xs text-muted-foreground">
          Set influence levels in team member profiles to see relationships
        </p>
      </div>
    )
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveChord
        data={matrix}
        keys={members}
        margin={{ top: 60, right: 60, bottom: 60, left: 60 }}
        valueFormat=".2f"
        padAngle={0.02}
        innerRadiusRatio={0.96}
        innerRadiusOffset={0.02}
        inactiveArcOpacity={0.25}
        inactiveRibbonOpacity={0.1}
        arcOpacity={1}
        arcBorderWidth={1}
        arcBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        ribbonOpacity={0.5}
        ribbonBorderWidth={1}
        ribbonBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        enableLabel={true}
        label="id"
        labelOffset={12}
        labelRotation={-90}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
        colors={COLORS}
        theme={{
          tooltip: {
            container: {
              background: 'white',
              color: '#333',
              fontSize: '12px',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              padding: '8px 12px',
            },
          },
          labels: {
            text: {
              fontSize: 12,
              fontWeight: 500,
            },
          },
        }}
        tooltip={({ ribbon }) => {
          if (!ribbon) return null
          const source = members[ribbon.source.index]
          const target = members[ribbon.target.index]
          const level = matrix[ribbon.source.index][ribbon.target.index]
          const label = INFLUENCE_LABELS[level as keyof typeof INFLUENCE_LABELS] || 'Unknown'

          return (
            <div>
              <div className="font-semibold">
                {source} → {target}
              </div>
              <div className="text-xs text-muted-foreground">
                Level {level}/5 - {label}
              </div>
            </div>
          )
        }}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 50,
            itemWidth: 80,
            itemHeight: 14,
            itemsSpacing: 0,
            itemTextColor: '#999',
            itemDirection: 'left-to-right',
            symbolSize: 12,
            symbolShape: 'circle',
          },
        ]}
      />
    </div>
  )
}
