'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { updateInfluence, deleteInfluence } from '@/app/actions/influence'
import type { MemberInfluence, TeamMember } from '@/types'
import { INFLUENCE_LABELS } from '@/types'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface InfluenceSectionProps {
  teamMemberId: string
  teamMemberName: string
  otherMembers: TeamMember[]
  influenceRelationships: MemberInfluence[]
}

export function InfluenceSection({
  teamMemberId,
  teamMemberName,
  otherMembers,
  influenceRelationships,
}: InfluenceSectionProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

  // Create a map of target_member_id -> influence_level for quick lookup
  const influenceMap = useMemo(() => {
    const map: Record<string, number> = {}
    influenceRelationships.forEach((rel) => {
      map[rel.target_member_id] = rel.influence_level
    })
    return map
  }, [influenceRelationships])

  // Calculate average influence level
  const averageInfluence = useMemo(() => {
    const levels = Object.values(influenceMap)
    if (levels.length === 0) return null
    const sum = levels.reduce((acc, level) => acc + level, 0)
    return sum / levels.length
  }, [influenceMap])

  async function handleInfluenceChange(targetMemberId: string, level: string) {
    setIsLoading((prev) => ({ ...prev, [targetMemberId]: true }))
    
    let result
    if (level === '0') {
      // Delete the relationship if "Not set" is selected
      result = await deleteInfluence(teamMemberId, targetMemberId)
    } else {
      result = await updateInfluence(teamMemberId, targetMemberId, parseInt(level))
    }
    
    setIsLoading((prev) => ({ ...prev, [targetMemberId]: false }))
    
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  function getInfluenceLabel(level: number): string {
    return INFLUENCE_LABELS[level] || 'Unknown'
  }

  function getAverageLabel(avg: number | null): string {
    if (avg === null) return 'Not Set'
    const rounded = Math.round(avg)
    return INFLUENCE_LABELS[rounded] || 'Unknown'
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Influence on Team</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Track how much {teamMemberName} influences each team member
          </p>
        </div>
      <div className="space-y-6">
        {/* Average Influence Display */}
        <div className="rounded-lg bg-secondary p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Average Influence</span>
            {averageInfluence !== null ? (
              <span className="text-lg font-bold">{averageInfluence.toFixed(1)}/5</span>
            ) : (
              <span className="text-sm text-muted-foreground">Not Set</span>
            )}
          </div>
          {averageInfluence !== null ? (
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${(averageInfluence / 5) * 100}%` }}
              />
            </div>
          ) : (
            <div className="h-2 w-full rounded-full bg-secondary" />
          )}
        </div>

        {/* Individual Influence Levels */}
        {otherMembers.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No other team members to track influence on
          </div>
        ) : (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Influence by Team Member</Label>
            <div className="space-y-0">
              {otherMembers.map((member, index) => {
                const currentLevel = influenceMap[member.id]
                const isLoadingMember = isLoading[member.id] || false

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between py-2.5 ${index === 0 ? 'pt-0' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      {currentLevel && (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex-1 max-w-[200px]">
                            <div
                              className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary"
                              role="progressbar"
                              aria-valuenow={currentLevel}
                              aria-valuemin={0}
                              aria-valuemax={5}
                              aria-label={`Influence level: ${currentLevel} out of 5`}
                            >
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${(currentLevel / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {currentLevel}/5 - {getInfluenceLabel(currentLevel)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="w-[140px]">
                      <Select
                        value={currentLevel?.toString() || '0'}
                        onValueChange={(value) => handleInfluenceChange(member.id, value)}
                        disabled={isLoadingMember}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Not set" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Not set</SelectItem>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <SelectItem key={level} value={level.toString()}>
                              {level} - {getInfluenceLabel(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
