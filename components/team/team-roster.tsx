'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown } from 'lucide-react'
import type { TeamMember } from '@/types'

type TeamMemberWithExtras = TeamMember & {
  skills: { overall_rating: number | null } | null
  avg_influence: number | null
}

type SortOption = 'name' | 'seniority' | 'skill_average' | 'influence' | 'motivation'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'seniority', label: 'Seniority' },
  { value: 'skill_average', label: 'Skill Average' },
  { value: 'influence', label: 'Influence' },
  { value: 'motivation', label: 'Motivation' },
]

// Seniority order: Senior > Semi Senior > Junior
const SENIORITY_ORDER: Record<string, number> = {
  'senior': 3,
  'semi senior': 2,
  'semisenior': 2,
  'semi-senior': 2,
  'junior': 1,
}

function getSeniorityOrder(seniority: string): number {
  const normalized = seniority.toLowerCase().trim()
  return SENIORITY_ORDER[normalized] ?? 0 // Unknown seniority levels go to the end
}

interface TeamRosterProps {
  teamMembers: TeamMemberWithExtras[]
}

export function TeamRoster({ teamMembers }: TeamRosterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const sortBy = (searchParams.get('sort') as SortOption) || 'name'
  const order = searchParams.get('order') || 'asc'

  // Sort team members based on current sort option
  const sortedMembers = useMemo(() => {
    const members = [...teamMembers]

    members.sort((a, b) => {
      let aValue: string | number | null
      let bValue: string | number | null
      let comparison = 0

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'seniority':
          // Two-level comparison: seniority first, then level
          const aSeniorityOrder = getSeniorityOrder(a.seniority)
          const bSeniorityOrder = getSeniorityOrder(b.seniority)
          
          if (aSeniorityOrder !== bSeniorityOrder) {
            // Different seniority - compare seniority order
            comparison = aSeniorityOrder - bSeniorityOrder
          } else {
            // Same seniority - compare by level (higher level first in desc)
            comparison = a.level - b.level
          }
          // Apply order direction
          return order === 'desc' ? -comparison : comparison
        case 'skill_average':
          aValue = a.skills?.overall_rating ?? null
          bValue = b.skills?.overall_rating ?? null
          break
        case 'influence':
          aValue = a.avg_influence ?? null
          bValue = b.avg_influence ?? null
          break
        case 'motivation':
          aValue = a.motivation_level
          bValue = b.motivation_level
          break
        default:
          return 0
      }

      // Handle null values - sort them to the end
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      }

      // For numeric sorts (skill_average, influence, motivation), reverse for desc order
      // For string sorts (name), reverse for desc order
      return order === 'desc' ? -comparison : comparison
    })

    return members
  }, [teamMembers, sortBy, order])

  function handleSortChange(newSort: SortOption) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      // If clicking the same sort option, toggle order
      if (newSort === sortBy) {
        const newOrder = order === 'asc' ? 'desc' : 'asc'
        params.set('order', newOrder)
      } else {
        // New sort option - default to desc for numeric fields and seniority, asc for name
        const isDescDefault = ['skill_average', 'influence', 'motivation', 'seniority'].includes(newSort)
        params.set('sort', newSort)
        params.set('order', isDescDefault ? 'desc' : 'asc')
      }
      
      router.push(`/team?${params.toString()}`)
    })
  }

  const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Name'
  const orderIndicator = order === 'asc' ? '↑' : '↓'

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortChange} disabled={isPending}>
            <SelectTrigger className="w-[180px]">
              <SelectValue>
                {currentSortLabel} {orderIndicator}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                  {sortBy === option.value && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {orderIndicator}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedMembers.map((member) => (
          <Link key={member.id} href={`/team/${member.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription className="mt-1">{member.seniority}</CardDescription>
                  </div>
                  <Badge variant="secondary">Level {member.level}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Influence:</span>
                    <span className="font-medium">
                      {member.avg_influence !== null
                        ? `${member.avg_influence.toFixed(1)}/5`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Motivation:</span>
                    <span className="font-medium">{member.motivation_level}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skill Average:</span>
                    <span className="font-medium">
                      {member.skills?.overall_rating !== null && member.skills?.overall_rating !== undefined
                        ? `${member.skills.overall_rating.toFixed(1)}/3.0`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
