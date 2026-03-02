'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'

interface MotivationHeatmapProps {
  memberMotivations: Array<{ id: string; name: string; motivation_level: number }>
  avgMotivation: number
}

export function MotivationHeatmap({ memberMotivations, avgMotivation }: MotivationHeatmapProps) {
  function getMotivationColor(level: number) {
    return 'bg-secondary text-muted-foreground border-border'
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Heart className="h-4 w-4 text-muted-foreground" />
          Team Motivation
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Average: {avgMotivation.toFixed(1)}/5</p>
      </div>
      {memberMotivations.length > 0 ? (
        <div className="space-y-0">
          {[...memberMotivations].sort((a, b) => b.motivation_level - a.motivation_level).map((member, index) => (
            <Link
              key={member.id}
              href={`/team/${member.id}`}
              className={`flex items-center justify-between py-2.5 hover:bg-white/5 transition-colors ${index === 0 ? 'pt-0' : ''}`}
            >
              <span className="text-sm font-medium text-foreground">{member.name}</span>
              <Badge variant="outline" className={getMotivationColor(member.motivation_level)}>
                {member.motivation_level}/5
              </Badge>
            </Link>
          ))}
          <div className="pt-3">
            <Link href="/team" className="text-sm text-blue-600 hover:underline font-medium">
              View all team members →
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No team members available</p>
      )}
    </div>
  )
}
