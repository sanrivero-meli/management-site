'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, FolderKanban, ExternalLink } from 'lucide-react'
import { ProjectsFilters } from '@/components/projects/projects-filters'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import type { Project } from '@/types'

interface ProjectsPageClientProps {
  projects: (Project & {
    assignments: Array<{
      id: string
      team_member_id: string
      team_members: { id: string; name: string } | null
    }>
  })[]
}

export function ProjectsPageClient({ projects }: ProjectsPageClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      Planning: 'bg-caution-muted text-caution',
      Active: 'bg-positive-muted text-positive',
      'On Hold': 'bg-secondary text-muted-foreground',
      Complete: 'bg-informative-muted text-informative',
      Cancelled: 'bg-[var(--negative-muted)] text-destructive',
    }
    return colors[status] || colors.Planning
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit' 
    })
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div className="space-y-8 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage all projects with scope, status, and Jira integration
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>

        {/* Filters and Search */}
        <ProjectsFilters />

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No projects yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsModalOpen(true)}
              >
                Create your first project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-card border border-border rounded-xl transition-all hover:border-input hover:shadow-[var(--shadow-andes-low)]"
              >
                {/* Main Content Area */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <Link 
                      href={`/projects/${project.id}`}
                      className="flex-1 min-w-0"
                    >
                      <h3 className="text-base font-semibold text-foreground leading-snug">
                        {project.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span 
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </span>
                      {project.jira_link && (
                        <a
                          href={project.jira_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${project.name} in Jira (opens in new tab)`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Metadata Area */}
                {(project.start_date || project.end_date || project.estimated !== null || (project.assignments && project.assignments.length > 0)) && (
                  <div className="px-5 py-3 pt-3 mt-3">
                    <div className="flex items-center gap-8 text-sm flex-wrap">
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Timeline:</span>
                          <span className="text-foreground font-normal">
                            {project.start_date ? formatDate(project.start_date) : '—'}
                            {' → '}
                            {project.end_date ? formatDate(project.end_date) : '—'}
                          </span>
                        </div>
                      )}
                      {project.estimated !== null && project.estimated !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Effort:</span>
                          <span className="text-foreground font-medium">
                            {project.estimated} {project.estimated === 1 ? 'sprint' : 'sprints'}
                          </span>
                        </div>
                      )}
                      {project.assignments && project.assignments.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Assignees:</span>
                          <span className="text-foreground font-medium">
                            {project.assignments
                              .map(a => a.team_members?.name)
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}
