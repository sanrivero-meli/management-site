'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateTeamMember, deleteTeamMember } from '@/app/actions/team'
import type { TeamMember, Goal, Feedback, Skills, MemberPerformanceProject, Project, MemberInfluence } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Edit2, Save, X, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GoalsSection } from './goals-section'
import { FeedbackSection } from './feedback-section'
import { SkillsSection } from './skills-section'
import { PerformanceProjectsSection } from './performance-projects-section'
import { InfluenceSection } from './influence-section'

interface TeamMemberDetailProps {
  member: TeamMember
  goals?: Goal[]
  feedback?: Feedback[]
  skills?: Skills | null
  performanceProjects?: MemberPerformanceProject[]
  projects?: Project[]
  influenceRelationships?: MemberInfluence[]
  otherMembers?: Pick<TeamMember, 'id' | 'name' | 'email'>[]
}

export function TeamMemberDetail({ member, goals = [], feedback = [], skills = null, performanceProjects = [], projects = [], influenceRelationships = [], otherMembers = [] }: TeamMemberDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteTeamMember(member.id)
    setIsDeleting(false)
    
    if (result?.error) {
      alert(result.error)
    } else {
      router.push('/team')
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await updateTeamMember(member.id, formData)
    setIsLoading(false)
    
    if (result?.error) {
      alert(result.error)
    } else {
      setIsEditing(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/team">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Button>
        </Link>
        <div className="flex items-center gap-2">
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
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading || isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {member.name}? This action cannot be undone and will remove all associated data including goals, feedback, and skills.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <h1 className="text-3xl font-bold">{member.name}</h1>

      <Tabs defaultValue="basic-info" className="w-full">
        <TabsList>
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="goals-feedback">Goals and Feedback</TabsTrigger>
          <TabsTrigger value="skills-projects">Skills and Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" className="space-y-6 mt-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Basic Information</h2>
                <p className="text-sm text-muted-foreground mb-4">Team member details</p>
              {isEditing ? (
                <form action={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={member.name}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={member.email}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seniority">Seniority</Label>
                      <Input
                        id="seniority"
                        name="seniority"
                        defaultValue={member.seniority}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Level</Label>
                      <Select name="level" defaultValue={member.level.toString()} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Level 1</SelectItem>
                          <SelectItem value="2">Level 2</SelectItem>
                          <SelectItem value="3">Level 3</SelectItem>
                        </SelectContent>
                      </Select>
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
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="mt-1 font-medium">{member.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="mt-1 font-medium">{member.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Seniority</Label>
                    <p className="mt-1 font-medium">{member.seniority}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Level</Label>
                    <Badge className="mt-1">Level {member.level}</Badge>
                  </div>
                </div>
              )}
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground mb-1">Motivation</h2>
                <p className="text-sm text-muted-foreground mb-4">Current motivation level</p>
              {isEditing ? (
                <form action={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="motivation_level">Motivation Level</Label>
                    <Select
                      name="motivation_level"
                      defaultValue={member.motivation_level.toString()}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {level} - {getMotivationLabel(level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              ) : (
                <div>
                  <Label className="text-muted-foreground">Motivation Level</Label>
                  <div className="mt-2">
                      <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div
                          className="h-2 w-full rounded-full bg-secondary"
                          role="progressbar"
                          aria-valuenow={member.motivation_level}
                          aria-valuemin={1}
                          aria-valuemax={5}
                          aria-label={`Motivation level: ${member.motivation_level} out of 5`}
                        >
                          <div
                            className="h-2 rounded-full bg-green-600"
                            style={{ width: `${(member.motivation_level / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {member.motivation_level}/5
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getMotivationLabel(member.motivation_level)}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          <InfluenceSection
            teamMemberId={member.id}
            teamMemberName={member.name}
            otherMembers={otherMembers}
            influenceRelationships={influenceRelationships}
          />
        </TabsContent>

        <TabsContent value="goals-feedback" className="space-y-6 mt-6">
          <GoalsSection teamMemberId={member.id} goals={goals} />
          <FeedbackSection teamMemberId={member.id} feedback={feedback} />
        </TabsContent>

        <TabsContent value="skills-projects" className="space-y-6 mt-6">
          <SkillsSection teamMemberId={member.id} skills={skills} />
          <PerformanceProjectsSection 
            teamMemberId={member.id} 
            performanceProjects={performanceProjects}
            projects={projects}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getMotivationLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Moderate',
    4: 'High',
    5: 'Very High',
  }
  return labels[level] || 'Unknown'
}
