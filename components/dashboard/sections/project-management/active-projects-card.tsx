'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { FolderKanban } from 'lucide-react'

interface ActiveProjectsCardProps {
  totalProjects: number
  projectsByStatus: Record<string, number>
}

export function ActiveProjectsCard({ totalProjects, projectsByStatus }: ActiveProjectsCardProps) {
  const statusColors: Record<string, string> = {
    Planning: 'bg-secondary text-muted-foreground border-border',
    Active: 'bg-secondary text-muted-foreground border-border',
    'On Hold': 'bg-secondary text-muted-foreground border-border',
    Complete: 'bg-secondary text-muted-foreground border-border',
    Cancelled: 'bg-[var(--negative-muted)] text-destructive border-destructive/30',
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
          Active Projects
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Total: {totalProjects} projects</p>
      </div>
      {Object.keys(projectsByStatus).length > 0 ? (
        <div className="space-y-3">
          {Object.entries(projectsByStatus)
            .sort(([, a], [, b]) => b - a)
            .map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <Badge variant="outline" className={statusColors[status] || 'bg-secondary text-muted-foreground'}>
                {status}
              </Badge>
              <span className="font-semibold text-lg">{count}</span>
            </div>
          ))}
          <div className="pt-2">
            <Link href="/projects" className="text-sm text-blue-600 hover:underline font-medium">
              View all projects →
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">No projects yet</p>
          <Link href="/projects/new" className="text-sm text-blue-600 hover:underline font-medium">
            Create your first project →
          </Link>
        </div>
      )}
    </div>
  )
}
