'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface UpcomingDeadlinesProps {
  upcomingDeadlines: Array<{ id: string; name: string; end_date: string; status: string }>
}

export function UpcomingDeadlines({ upcomingDeadlines }: UpcomingDeadlinesProps) {
  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  function getDaysUntil(dateString: string): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateString)
    target.setHours(0, 0, 0, 0)
    const diff = target.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  function getStatusColor(status: string) {
    return 'bg-secondary text-muted-foreground'
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Upcoming Deadlines
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {upcomingDeadlines.length === 0 
            ? 'Projects ending in the next 30 days'
            : `${upcomingDeadlines.length} project${upcomingDeadlines.length !== 1 ? 's' : ''} ending soon`}
        </p>
      </div>
      {upcomingDeadlines.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
      ) : (
        <div className="space-y-0">
          {[...upcomingDeadlines]
            .sort((a, b) => {
              const daysA = getDaysUntil(a.end_date)
              const daysB = getDaysUntil(b.end_date)
              return daysA - daysB // Sort by days until (soonest first)
            })
            .slice(0, 5)
            .map((project, index) => {
            const daysUntil = getDaysUntil(project.end_date)
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={`block py-2.5 hover:bg-white/5 transition-colors ${index === 0 ? 'pt-0' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{project.name}</span>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(project.end_date)}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className={daysUntil <= 7 ? 'text-foreground font-medium' : ''}>
                        {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? 'Due tomorrow' : `${daysUntil} days`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
          {upcomingDeadlines.length > 5 && (
            <Link href="/projects" className="text-sm text-blue-600 hover:underline font-medium block text-center pt-3">
              View all ({upcomingDeadlines.length} total) →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
