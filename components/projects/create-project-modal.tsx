'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/app/actions/projects'
import { getTeamMembers } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Save } from 'lucide-react'
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_CATEGORIES,
  PROJECT_SQUADS,
  PROJECT_TAGS,
  PRODUCT_OWNERS,
  type TeamMember,
} from '@/types'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateProjectModal({ open, onOpenChange, onSuccess }: CreateProjectModalProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      async function loadTeamMembers() {
        try {
          const members = await getTeamMembers()
          setTeamMembers(members)
        } catch (err) {
          console.error('Failed to load team members:', err)
        }
      }
      loadTeamMembers()
    }
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setError(null)
      setSelectedTags([])
      setSelectedOwners([])
      setIsLoading(false)
      if (formRef.current) {
        formRef.current.reset()
      }
    }
  }, [open])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    // Add tags and owners as JSON strings
    formData.set('tags', JSON.stringify(selectedTags))
    formData.set('owners', JSON.stringify(selectedOwners))

    const result = await createProject(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/projects/${result.data.id}`)
        router.refresh()
      }
    }
  }

  // Options for multi-selects
  const tagOptions = PROJECT_TAGS.map(tag => ({ value: tag, label: tag }))
  const ownerOptions = teamMembers.map(member => ({ value: member.id, label: member.name }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Enter the project details</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-name">Name *</Label>
            <Input
              id="modal-name"
              name="name"
              required
              disabled={isLoading}
              placeholder="Project name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal-description">Description</Label>
            <Textarea
              id="modal-description"
              name="description"
              disabled={isLoading}
              rows={4}
              placeholder="Brief description of the project"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal-scope">Scope</Label>
            <Textarea
              id="modal-scope"
              name="scope"
              disabled={isLoading}
              rows={6}
              placeholder="Project scope and deliverables"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal-jira_link">Jira</Label>
            <Input
              id="modal-jira_link"
              name="jira_link"
              type="url"
              disabled={isLoading}
              placeholder="https://..."
            />
          </div>

          {/* Row 1: Status, Category, Priority */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="modal-status">Status</Label>
              <Select name="status" defaultValue="Planning" disabled={isLoading}>
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
              <Label htmlFor="modal-category">Category</Label>
              <Select name="category" disabled={isLoading}>
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
              <Label htmlFor="modal-priority">Priority</Label>
              <Select name="priority" disabled={isLoading}>
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
              <Label htmlFor="modal-squad">Squad</Label>
              <Select name="squad" disabled={isLoading}>
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
              <Label htmlFor="modal-product_owner">Product</Label>
              <Select name="product_owner" disabled={isLoading}>
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
              <Label htmlFor="modal-start_date">Start Date</Label>
              <DatePicker
                id="modal-start_date"
                name="start_date"
                disabled={isLoading}
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-end_date">End Date</Label>
              <DatePicker
                id="modal-end_date"
                name="end_date"
                disabled={isLoading}
                placeholder="Select end date"
              />
            </div>
          </div>

          {/* Row 4: Estimated */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="modal-estimated">Estimated (sprints)</Label>
              <Input
                id="modal-estimated"
                name="estimated"
                type="number"
                step="0.01"
                disabled={isLoading}
                placeholder="0.00"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
