'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface InfluenceAnalyticsProps {
  members: string[]
  memberIds: string[]
  matrix: number[][]
}

interface TopInfluencer {
  name: string
  id: string
  totalInfluence: number
  averageInfluence: number
  relationshipCount: number
}

interface MutualRelationship {
  member1: string
  member1Id: string
  member2: string
  member2Id: string
  influence1to2: number
  influence2to1: number
  combinedStrength: number
}

export function InfluenceAnalytics({ members, memberIds, matrix }: InfluenceAnalyticsProps) {
  // Calculate top influencers
  const topInfluencers = useMemo(() => {
    const influencers: TopInfluencer[] = members.map((name, index) => {
      const row = matrix[index] || []
      const relationships = row.filter((val) => val > 0)
      const totalInfluence = relationships.reduce((sum, val) => sum + val, 0)
      const averageInfluence =
        relationships.length > 0 ? totalInfluence / relationships.length : 0

      return {
        name,
        id: memberIds[index],
        totalInfluence,
        averageInfluence,
        relationshipCount: relationships.length,
      }
    })

    return influencers
      .filter((inf) => inf.relationshipCount > 0)
      .sort((a, b) => b.totalInfluence - a.totalInfluence)
  }, [members, memberIds, matrix])

  // Find mutual relationships
  const mutualRelationships = useMemo(() => {
    const mutuals: MutualRelationship[] = []
    const processed = new Set<string>()

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const influence1to2 = matrix[i]?.[j] || 0
        const influence2to1 = matrix[j]?.[i] || 0

        if (influence1to2 > 0 && influence2to1 > 0) {
          const pairKey = `${Math.min(i, j)}-${Math.max(i, j)}`
          if (!processed.has(pairKey)) {
            processed.add(pairKey)
            mutuals.push({
              member1: members[i],
              member1Id: memberIds[i],
              member2: members[j],
              member2Id: memberIds[j],
              influence1to2,
              influence2to1,
              combinedStrength: influence1to2 + influence2to1,
            })
          }
        }
      }
    }

    return mutuals.sort((a, b) => {
      // Sort by minimum influence level (strongest relationships first)
      const minA = Math.min(a.influence1to2, a.influence2to1)
      const minB = Math.min(b.influence1to2, b.influence2to1)
      if (minB !== minA) {
        return minB - minA
      }
      // If minimum is the same, sort by combined strength
      return b.combinedStrength - a.combinedStrength
    })
  }, [members, memberIds, matrix])

  // Get max influence for progress bar scaling
  const maxInfluence = useMemo(() => {
    if (topInfluencers.length === 0) return 1
    return Math.max(...topInfluencers.map((inf) => inf.totalInfluence), 1)
  }, [topInfluencers])

  if (!members || members.length < 2) {
    return (
      <div className="space-y-4">
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          {members.length === 0
            ? 'No team members to display'
            : 'Need at least 2 team members to show influence relationships'}
        </div>
      </div>
    )
  }

  const hasRelationships = matrix.some((row) => row.some((val) => val > 0))

  if (!hasRelationships) {
    return (
      <div className="space-y-4">
        <div className="flex h-[200px] flex-col items-center justify-center text-sm text-muted-foreground">
          <p className="mb-2">No influence relationships defined yet</p>
          <p className="text-xs text-muted-foreground">
            Set influence levels in team member profiles to see relationships
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Influencers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Influencers</CardTitle>
          <CardDescription>
            Team members ranked by total outgoing influence
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topInfluencers.length > 0 ? (
            <div className="space-y-4">
              {topInfluencers.map((influencer, index) => (
                <div
                  key={influencer.id}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="shrink-0">
                      #{index + 1}
                    </Badge>
                    <Link
                      href={`/team/${influencer.id}`}
                      className="font-medium hover:underline truncate"
                    >
                      {influencer.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-32">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-sm font-semibold">
                          {influencer.totalInfluence}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${(influencer.totalInfluence / maxInfluence) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="text-xs text-muted-foreground">Avg</div>
                      <div className="text-sm font-semibold">
                        {influencer.averageInfluence.toFixed(1)}/5
                      </div>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <div className="text-xs text-muted-foreground">Count</div>
                      <div className="text-sm font-semibold">
                        {influencer.relationshipCount}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No influencers found</p>
          )}
        </CardContent>
      </Card>

      {/* Mutual Relationships */}
      <Card>
        <CardHeader>
          <CardTitle>Mutual Influence Relationships</CardTitle>
          <CardDescription>
            Bidirectional influence relationships between team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mutualRelationships.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member 1</TableHead>
                  <TableHead>Member 2</TableHead>
                  <TableHead className="text-center">Influence</TableHead>
                  <TableHead className="text-right">Strength</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mutualRelationships.map((mutual, index) => {
                  const isStrong =
                    mutual.influence1to2 >= 4 && mutual.influence2to1 >= 4
                  return (
                    <TableRow key={`${mutual.member1Id}-${mutual.member2Id}`}>
                      <TableCell>
                        <Link
                          href={`/team/${mutual.member1Id}`}
                          className="font-medium hover:underline"
                        >
                          {mutual.member1}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/team/${mutual.member2Id}`}
                          className="font-medium hover:underline"
                        >
                          {mutual.member2}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {mutual.influence1to2}/5
                          </Badge>
                          <span className="text-muted-foreground">↔</span>
                          <Badge variant="outline" className="text-xs">
                            {mutual.influence2to1}/5
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isStrong ? (
                          <Badge variant="default" className="bg-green-600">
                            Strong
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Moderate</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No mutual influence relationships found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
