'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, Target, Users } from 'lucide-react'

interface AlertBannerProps {
  goalsAtRisk: number
  lowMotivationMembers: Array<{ id: string; name: string; motivation_level: number }>
}

export function AlertBanner({ goalsAtRisk, lowMotivationMembers }: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const hasAlerts = goalsAtRisk > 0 || lowMotivationMembers.length > 0

  if (!hasAlerts || isDismissed) {
    return null
  }

  return (
    <Card className="border-border bg-secondary">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Attention Required</h3>
              <div className="space-y-2 text-sm">
                {goalsAtRisk > 0 && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      <strong>{goalsAtRisk}</strong> goal{goalsAtRisk !== 1 ? 's' : ''} at risk
                    </span>
                    <Link href="/team" aria-label="View goals at risk" className="text-foreground hover:text-foreground hover:underline font-medium">
                      View →
                    </Link>
                  </div>
                )}
                {lowMotivationMembers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      <strong>{lowMotivationMembers.length}</strong> team member{lowMotivationMembers.length !== 1 ? 's' : ''} with low motivation
                    </span>
                    <Link href="/team" aria-label="View members with low motivation" className="text-foreground hover:text-foreground hover:underline font-medium">
                      View →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss alerts"
            className="text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
