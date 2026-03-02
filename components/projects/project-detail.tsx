'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateProject } from '@/app/actions/projects'
import { getTeamMembers } from '@/app/actions/team'
import type { Project, TeamMember } from '@/types'
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_CATEGORIES,
  PROJECT_SQUADS,
  PROJECT_TAGS,
  PRODUCT_OWNERS,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { MultiSelect } from '@/components/ui/multi-select'
import { ArrowLeft, Edit2, Save, X, ExternalLink, Users, Calendar } from 'lucide-react'
import { TasksSection } from './tasks-section'
import { RoadmapChart } from './roadmap-chart'

interface ProjectDetailProps {
  project: Project
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(project.tags || [])
  const [selectedOwners, setSelectedOwners] = useState<string[]>(project.owners || [])

  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const members = await getTeamMembers()
        setTeamMembers(members)
      } catch (err) {
        console.error('Failed to load team members:', err)
      }
    }
    loadTeamMembers()
  }, [])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    // Add tags and owners as JSON strings
    formData.set('tags', JSON.stringify(selectedTags))
    formData.set('owners', JSON.stringify(selectedOwners))
    
    const result = await updateProject(project.id, formData)
    setIsLoading(false)
    
    if (result?.error) {
      alert(result.error)
    } else {
      setIsEditing(false)
      router.refresh()
    }
  }

  // Options for multi-selects
  const tagOptions = PROJECT_TAGS.map(tag => ({ value: tag, label: tag }))
  const ownerOptions = teamMembers.map(member => ({ value: member.id, label: member.name }))

  function getStatusColor(status: Project['status']) {
    const colors: Record<Project['status'], string> = {
      Planning: 'bg-secondary text-muted-foreground',
      'To Do': 'bg-secondary text-secondary-foreground',
      Doing: 'bg-informative-muted text-informative',
      Paused: 'bg-caution-muted text-caution',
      Done: 'bg-positive-muted text-positive',
      Cancelled: 'bg-[var(--negative-muted)] text-destructive',
    }
    return colors[status] || 'bg-secondary text-muted-foreground'
  }

  function getPriorityColor(priority: Project['priority']) {
    if (!priority) return ''
    const colors: Record<string, string> = {
      HIT: 'bg-[var(--negative-muted)] text-destructive',
      Carryover: 'bg-caution-muted text-caution',
      BAU: 'bg-informative-muted text-informative',
      'World Class': 'bg-[rgba(147,51,234,0.15)] text-[rgb(167,85,247)]',
      Wishlist: 'bg-[rgba(219,39,119,0.15)] text-[rgb(236,72,153)]',
      Quality: 'bg-[rgba(20,184,166,0.15)] text-[rgb(45,212,191)]',
    }
    return colors[priority] || 'bg-secondary text-muted-foreground'
  }

  // Get owner names from IDs
  function getOwnerNames(ownerIds: string[] | null): string[] {
    if (!ownerIds || ownerIds.length === 0) return []
    return ownerIds
      .map(id => teamMembers.find(m => m.id === id)?.name)
      .filter((name): name is string => !!name)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <Button
          variant={isEditing ? 'outline' : 'default'}
          onClick={() => setIsEditing(!isEditing)}
          disabled={isLoading}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4" />
              Edit
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isEditing ? (
            <div className="p-6">
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={project.name}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={project.description || ''}
                    disabled={isLoading}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Textarea
                    id="scope"
                    name="scope"
                    defaultValue={project.scope || ''}
                    disabled={isLoading}
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jira_link">Jira</Label>
                  <Input
                    id="jira_link"
                    name="jira_link"
                    type="url"
                    defaultValue={project.jira_link || ''}
                    disabled={isLoading}
                    placeholder="https://..."
                  />
                </div>

                {/* Row 1: Status, Category, Priority */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      name="status"
                      defaultValue={project.status}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={project.category || ''} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue={project.priority || ''} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_PRIORITIES.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Tags, Squad, Owners */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <MultiSelect
                      options={tagOptions}
                      selected={selectedTags}
                      onChange={setSelectedTags}
                      placeholder="Select tags"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="squad">Squad</Label>
                    <Select name="squad" defaultValue={project.squad || ''} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select squad" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_SQUADS.map((squad) => (
                          <SelectItem key={squad} value={squad}>
                            {squad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Owners</Label>
                    <MultiSelect
                      options={ownerOptions}
                      selected={selectedOwners}
                      onChange={setSelectedOwners}
                      placeholder="Select owners"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Row 3: Product, Start Date, End Date */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="product_owner">Product</Label>
                    <Select name="product_owner" defaultValue={project.product_owner || ''} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_OWNERS.map((owner) => (
                          <SelectItem key={owner} value={owner}>
                            {owner}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <DatePicker
                      id="start_date"
                      name="start_date"
                      defaultValue={project.start_date || ''}
                      disabled={isLoading}
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <DatePicker
                      id="end_date"
                      name="end_date"
                      defaultValue={project.end_date || ''}
                      disabled={isLoading}
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                {/* Row 4: Estimated */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="estimated">Estimated (sprints)</Label>
                    <Input
                      id="estimated"
                      name="estimated"
                      type="number"
                      step="0.01"
                      defaultValue={project.estimated || ''}
                      disabled={isLoading}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6 px-6 pb-0">
              {/* Header: Title + Status Badges + Metadata */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
                  <div className="flex items-center gap-2 shrink-0">
                    {project.jira_link && (
                      <a
                        href={project.jira_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        title="View in Jira"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    {project.priority && (
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Metadata Row: Category badge, Squad, Product */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {project.category && (
                    <span>{project.category}</span>
                  )}
                  {project.squad && (
                    <span>{project.squad}</span>
                  )}
                  {project.product_owner && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{project.product_owner}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Description Section */}
              {project.description && (
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Description
                  </h2>
                  <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Scope Section */}
              {project.scope && (
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Scope
                  </h2>
                  <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                    {project.scope}
                  </p>
                </div>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Footer: Owners on left, Dates and Sprint on right */}
              <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
                {/* Owners */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {project.owners && project.owners.length > 0
                      ? getOwnerNames(project.owners).join(', ')
                      : 'No owners assigned'}
                  </span>
                </div>

                {/* Dates and Sprint */}
                <div className="flex items-center gap-3">
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {project.start_date && new Date(project.start_date).toLocaleDateString('en-GB')}
                        {project.start_date && project.end_date && ' – '}
                        {project.end_date && new Date(project.end_date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                  {project.estimated !== null && project.estimated !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {project.estimated} sprint{project.estimated !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RoadmapChart project={project} />

      <div id="tasks-section">
        <TasksSection project={project} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Team Assignments</h2>
        <p className="text-sm text-muted-foreground mb-4">Assigned team members and sprint allocation</p>
        <p className="text-sm text-muted-foreground">
          Team assignments will be displayed here. Manage assignments in the Planning page.
        </p>
      </div>
    </div>
  )
}
