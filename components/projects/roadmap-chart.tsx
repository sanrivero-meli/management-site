'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, useDraggable } from '@dnd-kit/core'
import { getProjectTasks, updateTask } from '@/app/actions/tasks'
import { getProjectMilestones, createMilestone, deleteMilestone } from '@/app/actions/milestones'
import { getTeamMembers } from '@/app/actions/team'
import type { ProjectTask, Project, ProjectMilestone, TeamMember } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  format, 
  addDays,
  addWeeks,
  addMonths,
  differenceInDays,
  isWithinInterval,
  parseISO,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns'
import { Plus, GripVertical, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { MILESTONE_COLORS } from '@/types'

interface RoadmapChartProps {
  project: Project
}

type ZoomLevel = 'week' | 'month' | 'quarter'
type GroupBy = 'none' | 'owner' | 'status'

interface TaskWithOwner extends ProjectTask {
  owner: { id: string; name: string } | null
}

function getStatusColor(status: ProjectTask['status']) {
  const colors: Record<ProjectTask['status'], string> = {
    'Not Started': 'bg-muted-foreground',
    'In Progress': 'bg-blue-500',
    'Blocked': 'bg-yellow-500',
    'Complete': 'bg-green-500',
  }
  return colors[status] || 'bg-muted-foreground'
}

function getStatusTextColor(status: ProjectTask['status']) {
  const colors: Record<ProjectTask['status'], string> = {
    'Not Started': 'text-muted-foreground',
    'In Progress': 'text-white',
    'Blocked': 'text-foreground',
    'Complete': 'text-white',
  }
  return colors[status] || 'text-muted-foreground'
}

function DraggableTaskBar({ 
  task, 
  left, 
  width, 
  top,
  onTaskClick,
  onHover,
  onHoverEnd,
}: { 
  task: TaskWithOwner
  left: number
  width: number
  top: number
  onTaskClick: () => void
  onHover: (e: React.MouseEvent) => void
  onHoverEnd: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, 0, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: `${left}%`,
        width: `${width}%`,
        top: `${top}px`,
        height: '32px',
        ...style,
      }}
      className="group cursor-move"
      onMouseMove={onHover}
      onMouseLeave={onHoverEnd}
    >
      <div
        className={`${getStatusColor(task.status)} ${getStatusTextColor(task.status)} rounded px-2 h-full flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow relative`}
        onClick={onTaskClick}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        <span className="text-xs font-medium truncate flex-1">{task.name}</span>
        {task.owner && (
          <span className="text-xs opacity-75 truncate max-w-[60px]">{task.owner.name}</span>
        )}
      </div>
    </div>
  )
}

function TaskTooltip({ task, x, y }: { task: TaskWithOwner; x: number; y: number }) {
  const [adjustedPos, setAdjustedPos] = useState({ x, y })
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAdjustedPos({
        x: Math.min(x, window.innerWidth - 300),
        y: Math.min(y, window.innerHeight - 200),
      })
    }
  }, [x, y])

  return (
    <div
      className="fixed z-50 bg-popover border rounded-lg shadow-lg p-3 max-w-xs pointer-events-none"
      style={{ 
        left: `${adjustedPos.x}px`, 
        top: `${adjustedPos.y}px` 
      }}
    >
      <div className="space-y-2">
        <div className="font-semibold text-sm">{task.name}</div>
        {task.description && (
          <div className="text-xs text-muted-foreground">{task.description}</div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
          {task.owner && <span className="text-muted-foreground">Owner: {task.owner.name}</span>}
        </div>
        {task.start_date && task.end_date && (
          <div className="text-xs text-muted-foreground">
            {format(parseISO(task.start_date), 'MMM d')} - {format(parseISO(task.end_date), 'MMM d')}
          </div>
        )}
        {task.deliverables && (
          <div className="text-xs text-muted-foreground">
            <strong>Deliverables:</strong> {task.deliverables}
          </div>
        )}
      </div>
    </div>
  )
}

function MilestoneMarker({ milestone, position, onDelete }: { milestone: ProjectMilestone; position: number; onDelete: () => void }) {
  return (
    <div
      className="absolute top-0 bottom-0 flex flex-col items-center z-30 group"
      style={{ left: `${position}%` }}
    >
      <div
        className="w-0 h-full border-l-2 border-dashed opacity-50"
        style={{ borderColor: milestone.color }}
      />
      <div
        className="absolute top-0 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] cursor-pointer hover:scale-110 transition-transform"
        style={{
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: milestone.color,
        }}
        title={milestone.name}
      />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <span>{milestone.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-destructive hover:text-destructive/80 cursor-pointer"
          type="button"
          aria-label={`Delete milestone ${milestone.name}`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export function RoadmapChart({ project }: RoadmapChartProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskWithOwner[]>([])
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [hoveredTask, setHoveredTask] = useState<TaskWithOwner | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false)
  const [timeOffset, setTimeOffset] = useState(0) // Offset from today in units (days/weeks/months)
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, milestonesData, membersData] = await Promise.all([
          getProjectTasks(project.id),
          getProjectMilestones(project.id),
          getTeamMembers(),
        ])
        setTasks(tasksData)
        setMilestones(milestonesData)
        setTeamMembers(membersData)
      } catch (err) {
        console.error('Failed to load roadmap data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [project.id])

  // Reset offset when zoom level changes
  useEffect(() => {
    setTimeOffset(0)
  }, [zoomLevel])

  // Calculate visible date range based on zoom level and offset
  const { visibleStart, visibleEnd, dateColumns } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let start: Date
    let end: Date
    let columns: Date[] = []

    // Date range starts from today + offset, extends by zoom level duration
    if (zoomLevel === 'week') {
      // Week view: 7 days from start, daily columns
      start = addDays(today, timeOffset * 7)
      end = addDays(start, 6)
      columns = eachDayOfInterval({ start, end })
    } else if (zoomLevel === 'month') {
      // Month view: ~4 weeks from start, weekly columns
      start = addWeeks(today, timeOffset * 4)
      end = addDays(start, 27) // 4 weeks
      columns = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
    } else { // quarter
      // Quarter view: 3 months from start, monthly columns
      start = addMonths(today, timeOffset * 3)
      end = addMonths(start, 2)
      end = addDays(end, 30) // Extend to end of 3rd month
      columns = eachMonthOfInterval({ start, end })
    }

    return { visibleStart: start, visibleEnd: end, dateColumns: columns }
  }, [zoomLevel, timeOffset])

  function navigatePrevious() {
    setTimeOffset(prev => prev - 1)
  }

  function navigateNext() {
    setTimeOffset(prev => prev + 1)
  }

  function navigateToday() {
    setTimeOffset(0)
  }

  const totalDays = differenceInDays(visibleEnd, visibleStart)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayPosition = isWithinInterval(today, { start: visibleStart, end: visibleEnd })
    ? (differenceInDays(today, visibleStart) / totalDays) * 100
    : -1

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: 'All Tasks', tasks }]
    } else if (groupBy === 'owner') {
      const groups = new Map<string, TaskWithOwner[]>()
      tasks.forEach(task => {
        const key = task.owner?.id || 'unassigned'
        const label = task.owner?.name || 'Unassigned'
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(task)
      })
      return Array.from(groups.entries()).map(([key, groupTasks]) => ({
        key,
        label: groupTasks[0]?.owner?.name || 'Unassigned',
        tasks: groupTasks,
      }))
    } else { // status
      const groups = new Map<string, TaskWithOwner[]>()
      tasks.forEach(task => {
        const key = task.status
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(task)
      })
      return Array.from(groups.entries()).map(([key, groupTasks]) => ({
        key,
        label: groupTasks[0].status,
        tasks: groupTasks,
      }))
    }
  }, [tasks, groupBy])

  function getDatePosition(date: Date | null): number {
    if (!date) return 0
    const daysDiff = differenceInDays(date, visibleStart)
    return Math.max(0, Math.min(100, (daysDiff / totalDays) * 100))
  }

  function getTaskWidth(startDate: string | null, endDate: string | null): number {
    if (!startDate || !endDate) return 5
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const daysDiff = differenceInDays(end, start)
    const width = (daysDiff / totalDays) * 100
    return Math.max(2, width)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event
    const task = tasks.find(t => t.id === active.id)
    if (!task || !task.start_date || !task.end_date || !timelineRef.current) return

    const timelineWidth = timelineRef.current.offsetWidth
    if (timelineWidth === 0) return

    // Calculate days per pixel
    const daysPerPixel = totalDays / timelineWidth
    const daysDelta = Math.round(delta.x * daysPerPixel)

    if (daysDelta === 0) return

    const newStart = addDays(parseISO(task.start_date), daysDelta)
    const newEnd = addDays(parseISO(task.end_date), daysDelta)

    // Ensure dates are within visible range
    if (newStart < visibleStart || newEnd > visibleEnd) {
      return // Don't update if dragging outside visible range
    }

    const formData = new FormData()
    formData.set('start_date', format(newStart, 'yyyy-MM-dd'))
    formData.set('end_date', format(newEnd, 'yyyy-MM-dd'))

    const result = await updateTask(task.id, formData)
    if (!result?.error) {
      router.refresh()
      const updatedTasks = await getProjectTasks(project.id)
      setTasks(updatedTasks)
    }
  }

  async function handleCreateMilestone(formData: FormData) {
    formData.append('project_id', project.id)
    const result = await createMilestone(formData)
    if (!result?.error) {
      setIsMilestoneDialogOpen(false)
      router.refresh()
      const updatedMilestones = await getProjectMilestones(project.id)
      setMilestones(updatedMilestones)
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    if (!confirm('Are you sure you want to delete this milestone?')) return
    
    const result = await deleteMilestone(milestoneId)
    if (!result?.error) {
      router.refresh()
      const updatedMilestones = await getProjectMilestones(project.id)
      setMilestones(updatedMilestones)
    }
  }

  function formatDateLabel(date: Date): string {
    if (zoomLevel === 'week') {
      // Daily view: "Mon 20"
      return format(date, 'EEE d')
    } else if (zoomLevel === 'month') {
      // Weekly view: "Jan 13"
      return format(date, 'MMM d')
    } else {
      // Monthly view: "January"
      return format(date, 'MMMM')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roadmap</CardTitle>
          <CardDescription>Project timeline and task schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading roadmap...</p>
        </CardContent>
      </Card>
    )
  }

  const hasData = tasks.length > 0 || milestones.length > 0 || project.start_date || project.end_date

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Roadmap</CardTitle>
            <CardDescription>Project timeline and task schedule</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation controls */}
            <div className="flex items-center gap-1 border rounded-md">
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={navigatePrevious}
                aria-label="Previous time period"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={navigateToday}
                className="px-2 text-xs"
                disabled={timeOffset === 0}
              >
                Today
              </Button>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={navigateNext}
                aria-label="Next time period"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select value={zoomLevel} onValueChange={(v) => setZoomLevel(v as ZoomLevel)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-[134px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="owner">Group by Owner</SelectItem>
                <SelectItem value="status">Group by Status</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                  Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Milestone</DialogTitle>
                  <DialogDescription>Create a milestone marker for this project</DialogDescription>
                </DialogHeader>
                <form action={handleCreateMilestone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="milestone-name">Name *</Label>
                    <Input id="milestone-name" name="name" required placeholder="Milestone name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="milestone-date">Date *</Label>
                    <DatePicker id="milestone-date" name="date" required placeholder="Select date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="milestone-color">Color</Label>
                    <Select name="color" defaultValue={MILESTONE_COLORS[0]}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MILESTONE_COLORS.map((color) => (
                          <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                              <span>{color}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsMilestoneDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Milestone</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">Add project dates and tasks to see the roadmap.</p>
        ) : (
          <DndContext onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {/* Timeline Header */}
              <div className="relative border-b pb-3">
                {/* Range labels */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span className="font-medium">{format(visibleStart, 'MMM d, yyyy')}</span>
                  <span className="text-xs">
                    {totalDays} days
                  </span>
                  <span className="font-medium">{format(visibleEnd, 'MMM d, yyyy')}</span>
                </div>
                {/* Column labels */}
                <div className="relative h-6 mb-2">
                  {dateColumns.map((date, idx) => {
                    const position = getDatePosition(date)
                    // Skip if position is too close to edges
                    if (position < 3 || position > 97) return null
                    return (
                      <div
                        key={idx}
                        className="absolute top-0 h-full"
                        style={{ left: `${position}%` }}
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap bg-background px-1">
                          {formatDateLabel(date)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Timeline track with grid and today marker */}
                <div className="relative h-4 bg-secondary rounded overflow-hidden">
                  {/* Grid lines */}
                  {dateColumns.map((date, idx) => {
                    const position = getDatePosition(date)
                    return (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 border-l border-border"
                        style={{ left: `${position}%` }}
                      />
                    )
                  })}
                  {/* Today marker */}
                  {todayPosition >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                      style={{ left: `${todayPosition}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                        Today
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Duration Bar */}
              {project.start_date && project.end_date && (
                <div className="relative h-8">
                  <div
                    className="absolute top-2 h-4 bg-muted-foreground rounded opacity-30"
                    style={{
                      left: `${getDatePosition(parseISO(project.start_date))}%`,
                      width: `${getTaskWidth(project.start_date, project.end_date)}%`,
                    }}
                    title={`Project: ${project.name}`}
                  />
                </div>
              )}

              {/* Task Rows */}
              <div className="relative" ref={timelineRef}>
                {groupedTasks.map((group) => (
                  <div key={group.key} className="mb-4">
                    {groupBy !== 'none' && (
                      <div className="text-sm font-medium text-muted-foreground mb-2 px-2">
                        {group.label} ({group.tasks.length})
                      </div>
                    )}
                    <div 
                      className="relative bg-secondary/50 rounded border border-border" 
                      style={{ minHeight: `${Math.max(group.tasks.length * 48, 48)}px` }}
                    >
                      {/* Grid lines in task area */}
                      {dateColumns.map((date, idx) => {
                        const position = getDatePosition(date)
                        return (
                          <div
                            key={`grid-${idx}`}
                            className="absolute top-0 bottom-0 border-l border-border"
                            style={{ left: `${position}%` }}
                          />
                        )
                      })}
                      {/* Today line in task area */}
                      {todayPosition >= 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500/30 z-10"
                          style={{ left: `${todayPosition}%` }}
                        />
                      )}
                      {group.tasks.map((task, taskIdx) => {
                        if (!task.start_date || !task.end_date) return null
                        const left = getDatePosition(parseISO(task.start_date))
                        const width = getTaskWidth(task.start_date, task.end_date)
                        const top = taskIdx * 48 + 8

                        return (
                          <DraggableTaskBar
                            key={task.id}
                            task={task}
                            left={left}
                            width={width}
                            top={top}
                            onTaskClick={() => {
                              // Scroll to tasks section or could open edit dialog
                              const tasksSection = document.getElementById('tasks-section')
                              if (tasksSection) {
                                tasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }
                            }}
                            onHover={(e) => {
                              setHoveredTask(task)
                              setTooltipPos({ x: e.clientX + 10, y: e.clientY + 10 })
                            }}
                            onHoverEnd={() => {
                              setHoveredTask(null)
                            }}
                          />
                        )
                      })}
                      {/* Milestone markers */}
                      {milestones.map((milestone) => {
                        const position = getDatePosition(parseISO(milestone.date))
                        return (
                          <MilestoneMarker
                            key={milestone.id}
                            milestone={milestone}
                            position={position}
                            onDelete={() => handleDeleteMilestone(milestone.id)}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tooltip */}
              {hoveredTask && (
                <TaskTooltip
                  task={hoveredTask}
                  x={tooltipPos.x}
                  y={tooltipPos.y}
                />
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 flex-wrap pt-4 border-t">
                <span className="text-sm font-medium">Legend:</span>
                {project.start_date && project.end_date && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted-foreground rounded opacity-30" />
                    <span className="text-xs">Project Duration</span>
                  </div>
                )}
                {(['Not Started', 'In Progress', 'Blocked', 'Complete'] as const).map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-4 h-4 ${getStatusColor(status)} rounded`} />
                    <span className="text-xs">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </DndContext>
        )}
      </CardContent>
    </Card>
  )
}
