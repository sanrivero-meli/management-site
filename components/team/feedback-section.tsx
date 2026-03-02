'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createFeedback, updateFeedback, deleteFeedback } from '@/app/actions/feedback'
import type { Feedback } from '@/types'
import { SKILL_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { SkillMultiSelect } from '@/components/ui/skill-multi-select'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'

interface FeedbackSectionProps {
  teamMemberId: string
  feedback: Feedback[]
}

export function FeedbackSection({ teamMemberId, feedback }: FeedbackSectionProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null)
  const [highlightsSkills, setHighlightsSkills] = useState<string[]>([])
  const [improvementsSkills, setImprovementsSkills] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize skills when editing
  useEffect(() => {
    if (editingFeedback) {
      setHighlightsSkills(editingFeedback.highlights_skills || [])
      setImprovementsSkills(editingFeedback.improvements_skills || [])
    } else {
      setHighlightsSkills([])
      setImprovementsSkills([])
    }
  }, [editingFeedback])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.append('team_member_id', teamMemberId)
      
      // Ensure feedback_date is set if DatePicker didn't update it
      const feedbackDate = formData.get('feedback_date')
      if (!feedbackDate) {
        formData.set('feedback_date', new Date().toISOString().split('T')[0])
      }
      
      const result = await createFeedback(formData)
      
      if (result?.error) {
        alert(result.error)
        setIsSubmitting(false)
      } else {
        setIsDialogOpen(false)
        setHighlightsSkills([])
        setImprovementsSkills([])
        setIsSubmitting(false)
        router.refresh()
      }
    } catch {
      alert('Failed to create feedback. Please try again.')
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingFeedback) return
    
    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      const result = await updateFeedback(editingFeedback.id, formData)
      
      if (result?.error) {
        alert(result.error)
        setIsSubmitting(false)
      } else {
        setEditingFeedback(null)
        setIsDialogOpen(false)
        setHighlightsSkills([])
        setImprovementsSkills([])
        setIsSubmitting(false)
        router.refresh()
      }
    } catch {
      alert('Failed to update feedback. Please try again.')
      setIsSubmitting(false)
    }
  }

  async function handleDelete(feedbackId: string) {
    if (!confirm('Are you sure you want to delete this feedback?')) return
    
    const result = await deleteFeedback(feedbackId, teamMemberId)
    
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Feedback History</h2>
            <p className="text-sm text-muted-foreground">Performance feedback over time</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                onClick={() => {
                  setEditingFeedback(null)
                  setHighlightsSkills([])
                  setImprovementsSkills([])
                }}
              >
                <Plus className="h-4 w-4" />
                Add Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFeedback ? 'Edit Feedback' : 'Add New Feedback'}</DialogTitle>
                <DialogDescription>
                  Record performance feedback for this team member
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingFeedback ? handleUpdate : handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cycle">Cycle *</Label>
                  <Input
                    id="cycle"
                    name="cycle"
                    defaultValue={editingFeedback?.cycle}
                    required
                    placeholder="e.g., 2024 Annual, Q1 2025, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback_date">Feedback Date *</Label>
                  <DatePicker
                    id="feedback_date"
                    name="feedback_date"
                    defaultValue={editingFeedback?.feedback_date || new Date().toISOString().split('T')[0]}
                    required
                    placeholder="Select feedback date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlights">Highlights *</Label>
                  <Textarea
                    id="highlights"
                    name="highlights"
                    defaultValue={editingFeedback?.highlights || editingFeedback?.content || ''}
                    required
                    rows={6}
                    placeholder="Enter highlights and positive feedback..."
                  />
                </div>
                <SkillMultiSelect
                  label="Related Skills (Highlights)"
                  selectedSkills={highlightsSkills}
                  onSkillsChange={setHighlightsSkills}
                  namePrefix="highlights_skills"
                />
                <div className="space-y-2">
                  <Label htmlFor="improvements">Improvements *</Label>
                  <Textarea
                    id="improvements"
                    name="improvements"
                    defaultValue={editingFeedback?.improvements || editingFeedback?.content || ''}
                    required
                    rows={6}
                    placeholder="Enter areas for improvement and growth opportunities..."
                  />
                </div>
                <SkillMultiSelect
                  label="Related Skills (Improvements)"
                  selectedSkills={improvementsSkills}
                  onSkillsChange={setImprovementsSkills}
                  namePrefix="improvements_skills"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingFeedback(null)
                      setHighlightsSkills([])
                      setImprovementsSkills([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingFeedback ? 'Update Feedback' : 'Create Feedback'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      {feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground">No feedback yet. Add your first feedback entry above.</p>
      ) : (
        <div className="space-y-0">
          {feedback.map((item, index) => (
            <div key={item.id} className={`py-4 ${index === 0 ? 'pt-0' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{item.cycle}</h4>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.feedback_date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    
                    {/* Highlights Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm text-positive">Highlights</h5>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-foreground pl-4 border-l-2 border-positive">
                        {item.highlights || item.content || 'No highlights provided.'}
                      </p>
                      {item.highlights_skills && item.highlights_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-4">
                          {item.highlights_skills.map((skill) => (
                            <Badge key={skill} variant="positive">
                              {SKILL_LABELS[skill] || skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Improvements Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm text-caution">Improvements</h5>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-foreground pl-4 border-l-2 border-caution">
                        {item.improvements || item.content || 'No improvements provided.'}
                      </p>
                      {item.improvements_skills && item.improvements_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-4">
                          {item.improvements_skills.map((skill) => (
                            <Badge key={skill} variant="caution">
                              {SKILL_LABELS[skill] || skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Edit feedback for ${item.cycle}`}
                      onClick={() => {
                        setEditingFeedback(item)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete feedback for ${item.cycle}`}
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      </div>
    </div>
  )
}
