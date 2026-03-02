'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createGoal, updateGoal, deleteGoal } from '@/app/actions/goals'
import type { Goal } from '@/types'
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
import { Plus, Edit2, Trash2, Calendar, X } from 'lucide-react'

interface GoalsSectionProps {
  teamMemberId: string
  goals: Goal[]
}

export function GoalsSection({ teamMemberId, goals }: GoalsSectionProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [keyActions, setKeyActions] = useState<string[]>([''])
  const [kpis, setKpis] = useState<string[]>([''])
  const [relatedSkills, setRelatedSkills] = useState<string[]>([])

  // Initialize form fields when editing a goal
  useEffect(() => {
    if (editingGoal) {
      setKeyActions(editingGoal.key_actions && editingGoal.key_actions.length > 0 ? editingGoal.key_actions : [''])
      setKpis(editingGoal.kpis && editingGoal.kpis.length > 0 ? editingGoal.kpis : [''])
      setRelatedSkills(editingGoal.related_skills && editingGoal.related_skills.length > 0 ? editingGoal.related_skills : [])
    } else {
      setKeyActions([''])
      setKpis([''])
      setRelatedSkills([])
    }
  }, [editingGoal])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('team_member_id', teamMemberId)
    
    // Add key actions to form data
    keyActions.forEach((action, index) => {
      if (action.trim()) {
        formData.append(`key_actions_${index}`, action.trim())
      }
    })
    
    // Add KPIs to form data
    kpis.forEach((kpi, index) => {
      if (kpi.trim()) {
        formData.append(`kpis_${index}`, kpi.trim())
      }
    })
    
    const result = await createGoal(formData)
    
    if (result?.error) {
      alert(result.error)
    } else {
      setIsDialogOpen(false)
      setKeyActions([''])
      setKpis([''])
      setRelatedSkills([])
      router.refresh()
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingGoal) return
    
    const formData = new FormData(e.currentTarget)
    
    // Add key actions to form data
    keyActions.forEach((action, index) => {
      if (action.trim()) {
        formData.append(`key_actions_${index}`, action.trim())
      }
    })
    
    // Add KPIs to form data
    kpis.forEach((kpi, index) => {
      if (kpi.trim()) {
        formData.append(`kpis_${index}`, kpi.trim())
      }
    })
    
    const result = await updateGoal(editingGoal.id, formData)
    
    if (result?.error) {
      alert(result.error)
    } else {
      setEditingGoal(null)
      setIsDialogOpen(false)
      setKeyActions([''])
      setKpis([''])
      setRelatedSkills([])
      router.refresh()
    }
  }

  async function handleDelete(goalId: string) {
    if (!confirm('Are you sure you want to delete this goal?')) return
    
    const result = await deleteGoal(goalId, teamMemberId)
    
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  function getStatusColor(status: Goal['status']) {
    const colors: Record<Goal['status'], string> = {
      'Not Started': 'bg-secondary text-muted-foreground',
      'In Progress': 'bg-informative-muted text-informative',
      'Blocked': 'bg-[var(--negative-muted)] text-destructive',
      'Complete': 'bg-positive-muted text-positive',
    }
    return colors[status] || colors['Not Started']
  }

  function addKeyAction() {
    setKeyActions([...keyActions, ''])
  }

  function removeKeyAction(index: number) {
    if (keyActions.length > 1) {
      setKeyActions(keyActions.filter((_, i) => i !== index))
    }
  }

  function updateKeyAction(index: number, value: string) {
    const updated = [...keyActions]
    updated[index] = value
    setKeyActions(updated)
  }

  function addKpi() {
    setKpis([...kpis, ''])
  }

  function removeKpi(index: number) {
    if (kpis.length > 1) {
      setKpis(kpis.filter((_, i) => i !== index))
    }
  }

  function updateKpi(index: number, value: string) {
    const updated = [...kpis]
    updated[index] = value
    setKpis(updated)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Goals</h2>
            <p className="text-sm text-muted-foreground">Goals for this team member</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingGoal(null)
                  setKeyActions([''])
                  setKpis([''])
                  setRelatedSkills([])
                }}
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
                <DialogDescription>
                  Create a goal with all relevant details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingGoal ? handleUpdate : handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingGoal?.title}
                    required
                    placeholder="Goal title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingGoal?.description || ''}
                    placeholder="Brief description of the goal"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Key Actions</Label>
                  <div className="space-y-2">
                    {keyActions.map((action, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          name={`key_actions_${index}`}
                          value={action}
                          onChange={(e) => updateKeyAction(index, e.target.value)}
                          placeholder={`Action ${index + 1}`}
                        />
                        {keyActions.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeKeyAction(index)}
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
                      onClick={addKeyAction}
                    >
                      <Plus className="h-4 w-4" />
                      Add Action
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>KPIs</Label>
                  <div className="space-y-2">
                    {kpis.map((kpi, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          name={`kpis_${index}`}
                          value={kpi}
                          onChange={(e) => updateKpi(index, e.target.value)}
                          placeholder={`KPI ${index + 1}`}
                        />
                        {kpis.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeKpi(index)}
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
                      onClick={addKpi}
                    >
                      <Plus className="h-4 w-4" />
                      Add KPI
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target_date">Target Date</Label>
                    <DatePicker
                      id="target_date"
                      name="target_date"
                      defaultValue={editingGoal?.target_date || ''}
                      placeholder="Select target date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      name="status"
                      defaultValue={editingGoal?.status || 'Not Started'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SkillMultiSelect
                  label="Related Skills"
                  selectedSkills={relatedSkills}
                  onSkillsChange={setRelatedSkills}
                  namePrefix="related_skills"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingGoal(null)
                      setRelatedSkills([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals yet. Add your first goal above.</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
            {goals.map((goal) => (
              <AccordionItem key={goal.id} value={goal.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3 text-left">
                    <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                    <span className="font-medium">{goal.title}</span>
                    {goal.target_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(goal.target_date).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {goal.description && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="mt-1 text-sm">{goal.description}</p>
                      </div>
                    )}
                    
                    {goal.key_actions && goal.key_actions.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Key Actions</Label>
                        <ul className="mt-1 space-y-1">
                          {goal.key_actions.map((action, index) => (
                            <li key={index} className="text-sm list-disc list-inside">
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {goal.kpis && goal.kpis.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">KPIs</Label>
                        <ul className="mt-1 space-y-1">
                          {goal.kpis.map((kpi, index) => (
                            <li key={index} className="text-sm list-disc list-inside">
                              {kpi}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {goal.related_skills && goal.related_skills.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Related Skills</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {goal.related_skills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {SKILL_LABELS[skill] || skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingGoal(goal)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(goal.id)}
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
