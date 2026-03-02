'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface MemberQuickStatusProps {
  memberMotivations: Array<{ id: string; name: string; motivation_level: number }>
  teamSkillAverages: Record<string, number>
}

export function MemberQuickStatus({ memberMotivations }: MemberQuickStatusProps) {
  // This component shows a quick overview of team members
  // For now, we'll show motivation levels, but this could be extended
  // to show other quick stats like skill averages, goal completion, etc.

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Team Overview
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Quick status of team members</p>
      </div>
      {memberMotivations.length > 0 ? (
        <div className="space-y-0">
          {[...memberMotivations].sort((a, b) => b.motivation_level - a.motivation_level).slice(0, 5).map((member, index) => (
            <Link
              key={member.id}
              href={`/team/${member.id}`}
              className={`flex items-center justify-between py-2.5 hover:bg-white/5 transition-colors ${index === 0 ? 'pt-0' : ''}`}
            >
              <span className="text-sm font-medium text-foreground">{member.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Mot: {member.motivation_level}/5
                </Badge>
              </div>
            </Link>
          ))}
          {memberMotivations.length > 5 && (
            <Link href="/team" className="text-sm text-blue-600 hover:underline font-medium block text-center pt-3">
              View all {memberMotivations.length} members →
            </Link>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No team members available</p>
      )}
    </div>
  )
}
