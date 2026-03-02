'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProject } from '@/app/actions/projects'
import { getTeamMembers } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { MultiSelect } from '@/components/ui/multi-select'
import { ArrowLeft, Save } from 'lucide-react'
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  PROJECT_CATEGORIES,
  PROJECT_SQUADS,
  PROJECT_TAGS,
  PRODUCT_OWNERS,
  type TeamMember,
} from '@/types'

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])

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
    setError(null)

    // Add tags and owners as JSON strings
    formData.set('tags', JSON.stringify(selectedTags))
    formData.set('owners', JSON.stringify(selectedOwners))

    const result = await createProject(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push(`/projects/${result.data.id}`)
      router.refresh()
    }
  }

  // Options for multi-selects
  const tagOptions = PROJECT_TAGS.map(tag => ({ value: tag, label: tag }))
  const ownerOptions = teamMembers.map(member => ({ value: member.id, label: member.name }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>Enter the project details</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                disabled={isLoading}
                placeholder="Project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                disabled={isLoading}
                rows={4}
                placeholder="Brief description of the project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Textarea
                id="scope"
                name="scope"
                disabled={isLoading}
                rows={6}
                placeholder="Project scope and deliverables"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jira_link">Jira</Label>
              <Input
                id="jira_link"
                name="jira_link"
                type="url"
                disabled={isLoading}
                placeholder="https://..."
              />
            </div>

            {/* Row 1: Status, Category, Priority */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
                <Label htmlFor="category">Category</Label>
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
                <Label htmlFor="priority">Priority</Label>
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
                <Label htmlFor="squad">Squad</Label>
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
                <Label htmlFor="product_owner">Product</Label>
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
                <Label htmlFor="start_date">Start Date</Label>
                <DatePicker
                  id="start_date"
                  name="start_date"
                  disabled={isLoading}
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <DatePicker
                  id="end_date"
                  name="end_date"
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

            <div className="flex justify-end gap-2">
              <Link href="/projects">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4" />
                {isLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
