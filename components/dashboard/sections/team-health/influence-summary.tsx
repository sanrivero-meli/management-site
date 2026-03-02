'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Users2, ChevronRight } from 'lucide-react'

interface InfluenceSummaryProps {
  influenceRelationships: {
    members: string[]
    memberIds: string[]
    matrix: number[][]
  }
}

export function InfluenceSummary({ influenceRelationships }: InfluenceSummaryProps) {
  // Calculate top influencers (simplified version)
  const topInfluencers = influenceRelationships.members.map((name, index) => {
    const row = influenceRelationships.matrix[index] || []
    const relationships = row.filter((val) => val > 0)
    const totalInfluence = relationships.reduce((sum, val) => sum + val, 0)
    return {
      name,
      id: influenceRelationships.memberIds[index],
      totalInfluence,
      relationshipCount: relationships.length,
    }
  })
    .filter((inf) => inf.relationshipCount > 0)
    .sort((a, b) => b.totalInfluence - a.totalInfluence)
    .slice(0, 3)

  const totalRelationships = influenceRelationships.matrix.reduce((sum, row) => {
    return sum + row.filter((val) => val > 0).length
  }, 0)

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Users2 className="h-4 w-4 text-muted-foreground" />
          Influence Network
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{totalRelationships} relationship{totalRelationships !== 1 ? 's' : ''} mapped</p>
      </div>
      {topInfluencers.length > 0 ? (
        <div className="space-y-0">
          {topInfluencers.map((influencer, index) => (
            <Link
              key={influencer.id}
              href={`/team/${influencer.id}`}
              className={`flex items-center justify-between py-2.5 hover:bg-white/5 transition-colors ${index === 0 ? 'pt-0' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0">
                  #{index + 1}
                </Badge>
                <span className="text-sm font-medium text-foreground">{influencer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {influencer.relationshipCount} connection{influencer.relationshipCount !== 1 ? 's' : ''}
                </span>
                <ChevronRight className="h-4 w-4" style={{ color: '#B9B9B9' }} />
              </div>
            </Link>
          ))}
          <div className="pt-3">
            <Link href="/team" className="text-sm text-blue-600 hover:underline font-medium">
              View full influence analytics →
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No influence relationships defined yet. Set influence levels in team member profiles.
        </p>
      )}
    </div>
  )
}
