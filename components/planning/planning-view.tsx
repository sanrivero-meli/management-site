'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createAssignment, updateAssignment, deleteAssignment } from '@/app/actions/assignments'
import type { TeamMember, Project, Assignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface PlanningViewProps {
  teamMembers: TeamMember[]
  projects: Project[]
  capacity: Array<{
    team_member_id: string
    name: string
    total_capacity: number
    allocated: number
    remaining: number
  }>
  assignments: (Assignment & {
    projects: { id: string; name: string }
    team_members: { id: string; name: string }
  })[]
  quarters: string[]
  selectedQuarter: string
}

export function PlanningView({
  teamMembers,
  projects,
  capacity,
  assignments,
  quarters,
  selectedQuarter,
}: PlanningViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  function handleQuarterChange(quarter: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('quarter', quarter)
    router.push(`/planning?${params.toString()}`)
  }

  async function handleCreate(formData: FormData) {
    formData.append('quarter', selectedQuarter)
    const result = await createAssignment(formData)

    if (result?.error) {
      alert(result.error)
    } else {
      setIsDialogOpen(false)
      setSelectedMemberId(null)
      router.refresh()
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingAssignment) return

    formData.append('quarter', selectedQuarter)
    const result = await updateAssignment(editingAssignment.id, formData)

    if (result?.error) {
      alert(result.error)
    } else {
      setEditingAssignment(null)
      setIsDialogOpen(false)
      router.refresh()
    }
  }

  async function handleDelete(assignmentId: string) {
    if (!confirm('Are you sure you want to delete this assignment?')) return

    const result = await deleteAssignment(assignmentId)

    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  function getCapacityColor(allocated: number) {
    if (allocated > 12) return 'text-red-600'
    if (allocated >= 10) return 'text-yellow-600'
    return 'text-green-600'
  }

  function getCapacityBgColor(allocated: number) {
    if (allocated > 12) return 'bg-red-600'
    if (allocated >= 10) return 'bg-yellow-600'
    return 'bg-blue-600'
  }

  const memberAssignments = assignments.reduce((acc, assignment) => {
    const memberId = assignment.team_member_id
    if (!acc[memberId]) {
      acc[memberId] = []
    }
    acc[memberId].push(assignment)
    return acc
  }, {} as Record<string, typeof assignments>)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planning</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sprint-based capacity planning and project assignment
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedQuarter} onValueChange={handleQuarterChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quarters.map((quarter) => (
                <SelectItem key={quarter} value={quarter}>
                  {quarter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capacity Overview</CardTitle>
          <CardDescription>
            Each team member has 12 sprints per quarter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Total Capacity</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capacity.map((cap) => {
                const percentage = Math.round((cap.allocated / cap.total_capacity) * 100)
                return (
                  <TableRow key={cap.team_member_id}>
                    <TableCell className="font-medium">{cap.name}</TableCell>
                    <TableCell>{cap.total_capacity}</TableCell>
                    <TableCell className={getCapacityColor(cap.allocated)}>
                      {cap.allocated}
                    </TableCell>
                    <TableCell>{cap.remaining}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 rounded-full bg-secondary">
                          <div
                            className={`h-2 rounded-full ${getCapacityBgColor(cap.allocated)}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {teamMembers.map((member, index) => {
          const memberAssignments = assignments.filter(
            (a) => a.team_member_id === member.id
          )
          const memberCapacity = capacity.find((c) => c.team_member_id === member.id)

          return (
            <div key={member.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {memberCapacity?.allocated || 0}/12 sprints allocated
                  </p>
                </div>
                  <Dialog open={isDialogOpen && selectedMemberId === member.id} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) {
                      setSelectedMemberId(null)
                      setEditingAssignment(null)
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedMemberId(member.id)
                          setEditingAssignment(null)
                        }}
                        disabled={(memberCapacity?.allocated || 0) >= 12}
                      >
                        <Plus className="h-4 w-4" />
                        Assign Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
                        </DialogTitle>
                        <DialogDescription>
                          Assign project to {member.name} for {selectedQuarter}
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        action={editingAssignment ? handleUpdate : handleCreate}
                        className="space-y-4"
                      >
                        <input
                          type="hidden"
                          name="team_member_id"
                          value={member.id}
                        />
                        {editingAssignment && (
                          <input type="hidden" name="assignment_id" value={editingAssignment.id} />
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="project_id">Project *</Label>
                          <Select
                            name="project_id"
                            defaultValue={editingAssignment?.project_id}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sprints_allocated">Sprints Allocated *</Label>
                          <Input
                            id="sprints_allocated"
                            name="sprints_allocated"
                            type="number"
                            step="0.25"
                            min="0.25"
                            max={memberCapacity?.remaining || 12}
                            defaultValue={editingAssignment?.sprints_allocated || 1}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Remaining capacity: {memberCapacity?.remaining || 0} sprints
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            defaultValue={editingAssignment?.notes || ''}
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsDialogOpen(false)
                              setSelectedMemberId(null)
                              setEditingAssignment(null)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
              </div>
              <div className="mt-4">
                {memberAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignments yet</p>
                ) : (
                  <div className="space-y-0">
                    {memberAssignments.map((assignment, assignmentIndex) => (
                      <div
                        key={assignment.id}
                        className={`flex items-center justify-between py-2.5 ${assignmentIndex === 0 ? 'pt-0' : ''}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {assignment.projects?.name || 'Unknown Project'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.sprints_allocated} sprints
                            {assignment.notes && ` • ${assignment.notes}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAssignment(assignment as Assignment)
                              setSelectedMemberId(member.id)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
