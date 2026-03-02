'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'
import { SKILL_LABELS } from '@/types'

interface FeedbackInsightsProps {
  feedbackSkillHighlights: Array<{ skill: string; count: number }>
  feedbackSkillImprovements: Array<{ skill: string; count: number }>
}

export function FeedbackInsights({ feedbackSkillHighlights, feedbackSkillImprovements }: FeedbackInsightsProps) {
  const hasData = feedbackSkillHighlights.length > 0 || feedbackSkillImprovements.length > 0

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Feedback Insights
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Most mentioned skills in feedback</p>
      </div>
      {hasData ? (
        <div className="space-y-4">
          {feedbackSkillHighlights.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Highlights</h4>
              <div className="flex flex-wrap gap-2">
                {feedbackSkillHighlights.map((item) => (
                  <Badge key={item.skill} variant="outline" className="bg-secondary text-muted-foreground border-border">
                    {SKILL_LABELS[item.skill] || item.skill} ({item.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {feedbackSkillImprovements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Improvements</h4>
              <div className="flex flex-wrap gap-2">
                {feedbackSkillImprovements.map((item) => (
                  <Badge key={item.skill} variant="outline" className="bg-secondary text-muted-foreground border-border">
                    {SKILL_LABELS[item.skill] || item.skill} ({item.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2">
            <Link href="/team" className="text-sm text-primary hover:underline font-medium">
              View all feedback →
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No feedback data available</p>
      )}
    </div>
  )
}
