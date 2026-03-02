'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPerformanceProject, updatePerformanceProject, deletePerformanceProject } from '@/app/actions/performance-projects'
import { getProjects } from '@/app/actions/projects'
import type { MemberPerformanceProject, Project } from '@/types'
import { SKILL_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SkillMultiSelect } from '@/components/ui/skill-multi-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Edit2, Trash2, Calendar, X, ExternalLink } from 'lucide-react'

interface PerformanceProjectsSectionProps {
  teamMemberId: string
  performanceProjects: MemberPerformanceProject[]
  projects: Project[]
}

export function PerformanceProjectsSection({ teamMemberId, performanceProjects, projects }: PerformanceProjectsSectionProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<MemberPerformanceProject | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isNewProject, setIsNewProject] = useState(false)
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([{ label: '', url: '' }])
  const [relatedSkills, setRelatedSkills] = useState<string[]>([])

  // Initialize form fields when editing a project
  useEffect(() => {
    if (editingProject) {
      setSelectedProjectId(editingProject.project_id || 'new')
      setIsNewProject(!editingProject.project_id)
      setLinks(editingProject.links && editingProject.links.length > 0 ? editingProject.links : [{ label: '', url: '' }])
      setRelatedSkills(editingProject.related_skills && editingProject.related_skills.length > 0 ? editingProject.related_skills : [])
    } else {
      setSelectedProjectId('')
      setIsNewProject(false)
      setLinks([{ label: '', url: '' }])
      setRelatedSkills([])
    }
  }, [editingProject])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('team_member_id', teamMemberId)
    
    // Add project_id or project_name
    if (isNewProject) {
      formData.append('project_id', 'new')
      formData.append('project_name', formData.get('project_name') as string)
    } else {
      formData.append('project_id', selectedProjectId)
      // Get project name from selected project
      const selectedProject = projects.find(p => p.id === selectedProjectId)
      formData.append('project_name', selectedProject?.name || '')
    }
    
    // Add links to form data
    links.forEach((link, index) => {
      if (link.label.trim() && link.url.trim()) {
        formData.append(`link_label_${index}`, link.label.trim())
        formData.append(`link_url_${index}`, link.url.trim())
      }
    })
    
    const result = await createPerformanceProject(formData)
    
    if (result?.error) {
      alert(result.error)
    } else {
      setIsDialogOpen(false)
      setSelectedProjectId('')
      setIsNewProject(false)
      setLinks([{ label: '', url: '' }])
      setRelatedSkills([])
      router.refresh()
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingProject) return
    
    const formData = new FormData(e.currentTarget)
    
    // Add project_id or project_name
    if (isNewProject) {
      formData.append('project_id', 'new')
      formData.append('project_name', formData.get('project_name') as string)
    } else {
      formData.append('project_id', selectedProjectId)
      // Get project name from selected project
      const selectedProject = projects.find(p => p.id === selectedProjectId)
      formData.append('project_name', selectedProject?.name || '')
    }
    
    // Add links to form data
    links.forEach((link, index) => {
      if (link.label.trim() && link.url.trim()) {
        formData.append(`link_label_${index}`, link.label.trim())
        formData.append(`link_url_${index}`, link.url.trim())
      }
    })
    
    const result = await updatePerformanceProject(editingProject.id, formData)
    
    if (result?.error) {
      alert(result.error)
    } else {
      setEditingProject(null)
      setIsDialogOpen(false)
      setSelectedProjectId('')
      setIsNewProject(false)
      setLinks([{ label: '', url: '' }])
      setRelatedSkills([])
      router.refresh()
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm('Are you sure you want to delete this performance project?')) return
    
    const result = await deletePerformanceProject(projectId, teamMemberId)
    
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  function getStatusColor(status: MemberPerformanceProject['status']) {
    const colors: Record<MemberPerformanceProject['status'], string> = {
      'Planning': 'bg-secondary text-muted-foreground',
      'Active': 'bg-informative-muted text-informative',
      'On Hold': 'bg-caution-muted text-caution',
      'Complete': 'bg-positive-muted text-positive',
      'Cancelled': 'bg-[var(--negative-muted)] text-destructive',
    }
    return colors[status] || colors['Planning']
  }

  function addLink() {
    setLinks([...links, { label: '', url: '' }])
  }

  function removeLink(index: number) {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index))
    }
  }

  function updateLink(index: number, field: 'label' | 'url', value: string) {
    const updated = [...links]
    updated[index] = { ...updated[index], [field]: value }
    setLinks(updated)
  }

  function getProjectName(project: MemberPerformanceProject): string {
    if (project.project_id) {
      const existingProject = projects.find(p => p.id === project.project_id)
      return existingProject?.name || project.project_name
    }
    return project.project_name
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Performance Projects</h2>
            <p className="text-sm text-muted-foreground">Projects relevant to team member performance</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingProject(null)
                  setSelectedProjectId('')
                  setIsNewProject(false)
                  setLinks([{ label: '', url: '' }])
                  setRelatedSkills([])
                }}
              >
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProject ? 'Edit Performance Project' : 'Add New Performance Project'}</DialogTitle>
                <DialogDescription>
                  Add a project relevant to this team member's performance
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingProject ? handleUpdate : handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project_selection">Project</Label>
                  <Select
                    value={isNewProject ? 'new' : selectedProjectId}
                    onValueChange={(value) => {
                      if (value === 'new') {
                        setIsNewProject(true)
                        setSelectedProjectId('')
                      } else {
                        setIsNewProject(false)
                        setSelectedProjectId(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or create new project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Create New Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isNewProject && (
                  <div className="space-y-2">
                    <Label htmlFor="project_name">Project Name *</Label>
                    <Input
                      id="project_name"
                      name="project_name"
                      defaultValue={editingProject?.project_name}
                      required={isNewProject}
                      placeholder="Enter project name"
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <DatePicker
                      id="start_date"
                      name="start_date"
                      defaultValue={editingProject?.start_date}
                      required
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <DatePicker
                      id="end_date"
                      name="end_date"
                      defaultValue={editingProject?.end_date || ''}
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    name="status"
                    defaultValue={editingProject?.status || 'Planning'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SkillMultiSelect
                  label="Related Skills"
                  selectedSkills={relatedSkills}
                  onSkillsChange={setRelatedSkills}
                  namePrefix="related_skills"
                />

                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    name="comments"
                    defaultValue={editingProject?.comments || ''}
                    placeholder="General comments about this project"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Links</Label>
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Link label"
                          value={link.label}
                          onChange={(e) => updateLink(index, 'label', e.target.value)}
                        />
                        <Input
                          placeholder="URL"
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                        />
                        {links.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeLink(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLink}
                    >
                      <Plus className="h-4 w-4" />
                      Add Link
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingProject(null)
                      setRelatedSkills([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      {performanceProjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No performance projects yet. Add your first project above.</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {performanceProjects.map((project) => (
            <AccordionItem key={project.id} value={project.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-3 text-left">
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  <span className="font-medium">{getProjectName(project)}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.start_date).toLocaleDateString('en-GB')}
                    {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString('en-GB')}`}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {project.comments && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Comments</Label>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{project.comments}</p>
                    </div>
                  )}
                  
                  {project.related_skills && project.related_skills.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Related Skills</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.related_skills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {SKILL_LABELS[skill] || skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {project.links && project.links.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Links</Label>
                      <div className="mt-2 space-y-1">
                        {project.links.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            {link.label || link.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProject(project)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      </div>
    </div>
  )
}
