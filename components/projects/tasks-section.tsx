'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getProjectTasks, createTask, updateTask, deleteTask } from '@/app/actions/tasks'
import { getTeamMembers } from '@/app/actions/team'
import type { ProjectTask, TeamMember, Project } from '@/types'
import { TASK_STATUSES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface TasksSectionProps {
  project: Project
}

export function TasksSection({ project }: TasksSectionProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<(ProjectTask & { owner: { id: string; name: string } | null })[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks-section.tsx:33',message:'loadData entry',data:{projectId:project.id,hasProjectId:!!project.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks-section.tsx:36',message:'Before Promise.all',data:{projectId:project.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const [tasksData, membersData] = await Promise.all([
          getProjectTasks(project.id),
          getTeamMembers(),
        ])
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks-section.tsx:42',message:'After Promise.all',data:{tasksLength:tasksData?.length||0,tasksData:tasksData,membersLength:membersData?.length||0,isArray:Array.isArray(tasksData)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setTasks(tasksData)
        setTeamMembers(membersData)
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks-section.tsx:45',message:'After setTasks',data:{tasksLength:tasksData?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks-section.tsx:47',message:'Error caught',data:{errorMessage:err instanceof Error?err.message:String(err),errorType:err?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.error('Failed to load tasks:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks'
        setError(errorMessage)
      } finally {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks-section.tsx:50',message:'Finally block - setting isLoading false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        setIsLoading(false)
      }
    }
    loadData()
  }, [project.id])

  async function handleCreate(formData: FormData) {
    formData.append('project_id', project.id)
    const result = await createTask(formData)

    if (result?.error) {
      alert(result.error)
    } else {
      setIsDialogOpen(false)
      setEditingTask(null)
      router.refresh()
      // Reload tasks
      const tasksData = await getProjectTasks(project.id)
      setTasks(tasksData)
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingTask) return

    const result = await updateTask(editingTask.id, formData)

    if (result?.error) {
      alert(result.error)
    } else {
      setEditingTask(null)
      setIsDialogOpen(false)
      router.refresh()
      // Reload tasks
      const tasksData = await getProjectTasks(project.id)
      setTasks(tasksData)
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return

    const result = await deleteTask(taskId)

    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
      // Reload tasks
      const tasksData = await getProjectTasks(project.id)
      setTasks(tasksData)
    }
  }

  function getStatusColor(status: ProjectTask['status']) {
    const colors: Record<ProjectTask['status'], string> = {
      'Not Started': 'bg-secondary text-muted-foreground',
      'In Progress': 'bg-informative-muted text-informative',
      'Blocked': 'bg-caution-muted text-caution',
      'Complete': 'bg-positive-muted text-positive',
    }
    return colors[status] || 'bg-secondary text-muted-foreground'
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Manage project tasks and deliverables</CardDescription>
          </div>
          <Dialog open={isDialogOpen && !editingTask} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Task</DialogTitle>
                <DialogDescription>Create a new task for this project</DialogDescription>
              </DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Task name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Task description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliverables">Deliverables</Label>
                  <Textarea
                    id="deliverables"
                    name="deliverables"
                    rows={3}
                    placeholder="Expected deliverables"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <DatePicker
                      id="start_date"
                      name="start_date"
                      placeholder="Select start date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <DatePicker
                      id="end_date"
                      name="end_date"
                      placeholder="Select end date"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner_id">Owner</Label>
                    <Select name="owner_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="Not Started">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingTask(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* #region agent log */}
        {(()=>{fetch('http://127.0.0.1:7244/ingest/6a666826-67e0-4db2-b6d6-650a30f83504',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks-section.tsx:232',message:'Render check',data:{isLoading,tasksLength:tasks.length,hasTasks:tasks.length>0,hasError:!!error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});return null})()}
        {/* #endregion */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600 font-medium">Error loading tasks</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            {error.includes('table') && error.includes('project_tasks') && (
              <p className="text-xs text-muted-foreground mt-2">
                The project_tasks table may not exist. Please run the migration file: <code className="bg-secondary px-1 rounded">migration_add_project_tasks.sql</code> in your Supabase SQL Editor.
              </p>
            )}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet. Click "Add Task" to create one.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>{task.owner?.name || '-'}</TableCell>
                  <TableCell>{formatDate(task.start_date)}</TableCell>
                  <TableCell>{formatDate(task.end_date)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={isDialogOpen && editingTask?.id === task.id}
                        onOpenChange={(open) => {
                          setIsDialogOpen(open)
                          if (!open) {
                            setEditingTask(null)
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTask(task)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                            <DialogDescription>Update task details</DialogDescription>
                          </DialogHeader>
                          <form action={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name *</Label>
                              <Input
                                id="edit-name"
                                name="name"
                                defaultValue={task.name}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                name="description"
                                rows={3}
                                defaultValue={task.description || ''}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-deliverables">Deliverables</Label>
                              <Textarea
                                id="edit-deliverables"
                                name="deliverables"
                                rows={3}
                                defaultValue={task.deliverables || ''}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-start_date">Start Date</Label>
                                <DatePicker
                                  id="edit-start_date"
                                  name="start_date"
                                  defaultValue={task.start_date || ''}
                                  placeholder="Select start date"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-end_date">End Date</Label>
                                <DatePicker
                                  id="edit-end_date"
                                  name="end_date"
                                  defaultValue={task.end_date || ''}
                                  placeholder="Select end date"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-owner_id">Owner</Label>
                                <Select name="owner_id" defaultValue={task.owner_id || '__none__'}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select owner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {teamMembers.map((member) => (
                                      <SelectItem key={member.id} value={member.id}>
                                        {member.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select name="status" defaultValue={task.status}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TASK_STATUSES.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsDialogOpen(false)
                                  setEditingTask(null)
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Update Task</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
