'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveDraft, publishSnapshot, getSkillsHistory, compareSkillsVersions } from '@/app/actions/skills'
import type { Skills, SkillsHistory, SkillsComparison } from '@/types'
import { SKILL_CATEGORIES, SKILL_LABELS, SKILL_DESCRIPTIONS, RATING_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Edit2, Save, X, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SkillsSectionProps {
  teamMemberId: string
  skills: Skills | null
}

type TabType = 'current' | 'history'

export function SkillsSection({ teamMemberId, skills }: SkillsSectionProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('current')
  const [history, setHistory] = useState<SkillsHistory[]>([])
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [comparison, setComparison] = useState<SkillsComparison | null>(null)
  const [selectedVersion1, setSelectedVersion1] = useState<string>('')
  const [selectedVersion2, setSelectedVersion2] = useState<string>('')
  const formRef = React.useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab, teamMemberId])

  async function loadHistory() {
    setIsLoadingHistory(true)
    try {
      const historyData = await getSkillsHistory(teamMemberId)
      setHistory(historyData)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  async function handleSaveDraft(formData: FormData) {
    setIsLoading(true)
    formData.append('team_member_id', teamMemberId)
    
    const result = await saveDraft(formData)
    setIsLoading(false)
    
    if (result?.error) {
      alert(result.error)
    } else {
      setIsEditing(false)
      router.refresh()
    }
  }

  async function handlePublishClick() {
    // First save the draft from the form
    if (formRef.current) {
      const formData = new FormData(formRef.current)
      formData.append('team_member_id', teamMemberId)
      
      setIsLoading(true)
      const saveResult = await saveDraft(formData)
      setIsLoading(false)
      
      if (saveResult?.error) {
        alert(saveResult.error)
        return
      }
    }
    
    // Then open the publish dialog
    setIsPublishDialogOpen(true)
  }

  async function handlePublish() {
    setIsLoading(true)
    const result = await publishSnapshot(teamMemberId, versionName || undefined)
    setIsLoading(false)
    
    if (result?.error) {
      alert(result.error)
    } else {
      setIsPublishDialogOpen(false)
      setVersionName('')
      setIsEditing(false)
      router.refresh()
      if (activeTab === 'history') {
        loadHistory()
      }
    }
  }

  async function handleCompare() {
    if (!selectedVersion1 || !selectedVersion2) {
      alert('Please select both versions to compare')
      return
    }
    
    setIsLoadingHistory(true)
    try {
      const comparisonData = await compareSkillsVersions(selectedVersion1, selectedVersion2)
      setComparison(comparisonData)
    } catch (error) {
      console.error('Failed to compare versions:', error)
      alert('Failed to compare versions')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  function getSkillValue(skillKey: string): string {
    if (!skills) return '0'
    return (skills[skillKey as keyof Skills] as number)?.toString() || '0'
  }

  function getSkillComment(skillKey: string): string {
    if (!skills?.skill_comments) return ''
    return skills.skill_comments[skillKey] || ''
  }

  function calculateCategoryAverage(category: string, skillsData?: Skills | SkillsHistory | null): number {
    const data = skillsData || skills
    if (!data) return 0
    
    const skillKeys = SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES]
    if (!skillKeys) return 0

    let totalRating = 0
    let skillCount = 0

    skillKeys.forEach((skillKey) => {
      const rating = data[skillKey as keyof typeof data] as number
      if (rating !== null && rating !== undefined) {
        totalRating += rating
        skillCount++
      }
    })

    return skillCount > 0 ? Math.round((totalRating / skillCount) * 10) / 10 : 0
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function getDeltaColor(delta: number): string {
    if (delta > 0) return 'text-green-600'
    if (delta < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  function getDeltaIcon(delta: number) {
    if (delta > 0) return <TrendingUp className="h-4 w-4" />
    if (delta < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
                Skills Mapping
              {skills?.is_draft && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  DRAFT
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">Comprehensive skill assessment (0-3 scale)</p>
          </div>
        </div>
        {!isEditing && (
          <Button size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
            Edit Skills
          </Button>
        )}
      </div>
      <div>
        {isEditing ? (
          <form ref={formRef} action={handleSaveDraft} className="space-y-6">
            <Accordion type="multiple" defaultValue={Object.keys(SKILL_CATEGORIES)}>
              {Object.entries(SKILL_CATEGORIES).map(([category, skillKeys]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="font-semibold">{category}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {skillKeys.map((skillKey) => (
                        <div key={skillKey} className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Label htmlFor={skillKey} className="cursor-pointer font-medium">
                                {SKILL_LABELS[skillKey]}
                              </Label>
                              {SKILL_DESCRIPTIONS[skillKey] && (
                                <p className="mt-1 text-xs text-muted-foreground italic">
                                  {SKILL_DESCRIPTIONS[skillKey]}
                                </p>
                              )}
                            </div>
                            <Select
                              name={skillKey}
                              defaultValue={getSkillValue(skillKey)}
                              disabled={isLoading}
                            >
                              <SelectTrigger className="w-[173px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[0, 1, 2, 3].map((rating) => (
                                  <SelectItem key={rating} value={rating.toString()}>
                                    {rating} - {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="mt-2">
                            <Label htmlFor={`${skillKey}_comment`} className="text-sm text-foreground">
                              Comment
                            </Label>
                            <Textarea
                              id={`${skillKey}_comment`}
                              name={`${skillKey}_comment`}
                              defaultValue={getSkillComment(skillKey)}
                              placeholder="Add context about next steps, strengths, areas for improvement..."
                              disabled={isLoading}
                              className="mt-1 min-h-20"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" variant="outline" disabled={isLoading}>
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={handlePublishClick}
                disabled={isLoading}
              >
                <FileText className="h-4 w-4" />
                Publish Snapshot
              </Button>
            </div>
          </form>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b mb-6">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'current'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                History
              </button>
            </div>

            {activeTab === 'current' ? (
              <div className="space-y-6">
                {skills ? (
                  <>
                    <div className="rounded-lg bg-secondary p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Overall Rating</span>
                        <span className="text-2xl font-bold">{skills.overall_rating?.toFixed(1) || 0}/3.0</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(SKILL_CATEGORIES).map((category) => {
                        const average = calculateCategoryAverage(category)
                        return (
                          <div
                            key={category}
                            className="rounded-lg bg-secondary p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold">{category}</span>
                              <span className="text-lg font-bold">{average.toFixed(1)}/3</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary">
                              <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{ width: `${(average / 3) * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Accordion type="multiple" defaultValue={Object.keys(SKILL_CATEGORIES)}>
                      {Object.entries(SKILL_CATEGORIES).map(([category, skillKeys]) => (
                        <AccordionItem key={category} value={category}>
                          <AccordionTrigger className="font-semibold">{category}</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              {skillKeys.map((skillKey) => {
                                const rating = skills[skillKey as keyof Skills] as number || 0
                                const comment = getSkillComment(skillKey)
                                return (
                                  <div key={skillKey} className="space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <span className="text-sm font-medium">{SKILL_LABELS[skillKey]}</span>
                                        {SKILL_DESCRIPTIONS[skillKey] && (
                                          <p className="mt-1 text-xs text-muted-foreground italic">
                                            {SKILL_DESCRIPTIONS[skillKey]}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="w-32">
                                          <div className="h-2 w-full rounded-full bg-secondary">
                                            <div
                                              className="h-2 rounded-full bg-blue-600"
                                              style={{ width: `${(rating / 3) * 100}%` }}
                                            />
                                          </div>
                                        </div>
                                        <span className="w-20 text-right text-sm font-medium">
                                          {rating}/3
                                        </span>
                                      </div>
                                    </div>
                                    {comment && (
                                      <div className="mt-2 rounded-md bg-secondary p-3">
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{comment}</p>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No skills assessment yet. Click "Edit Skills" to add skill ratings.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Comparison View */}
                <Card>
                  <CardHeader>
                    <CardTitle>Compare Versions</CardTitle>
                    <CardDescription>Select two versions to compare skill changes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Version 1</Label>
                        <Select value={selectedVersion1} onValueChange={setSelectedVersion1}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select version" />
                          </SelectTrigger>
                          <SelectContent>
                            {history.map((version) => (
                              <SelectItem key={version.id} value={version.id}>
                                {formatDate(version.version_date)}
                                {version.version_name && ` - ${version.version_name}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Version 2</Label>
                        <Select value={selectedVersion2} onValueChange={setSelectedVersion2}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select version" />
                          </SelectTrigger>
                          <SelectContent>
                            {history.map((version) => (
                              <SelectItem key={version.id} value={version.id}>
                                {formatDate(version.version_date)}
                                {version.version_name && ` - ${version.version_name}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleCompare} disabled={!selectedVersion1 || !selectedVersion2 || isLoadingHistory}>
                      Compare
                    </Button>

                    {comparison && (
                      <div className="mt-6 space-y-4">
                        <div className="rounded-lg border p-4">
                          <h4 className="font-semibold mb-4">Overall Rating Change</h4>
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Version 1: </span>
                              <span className="font-medium">{comparison.version1.overall_rating?.toFixed(1) || 0}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Version 2: </span>
                              <span className="font-medium">{comparison.version2.overall_rating?.toFixed(1) || 0}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${getDeltaColor(comparison.deltas.overall_rating)}`}>
                              {getDeltaIcon(comparison.deltas.overall_rating)}
                              <span className="font-medium">
                                {comparison.deltas.overall_rating > 0 ? '+' : ''}
                                {comparison.deltas.overall_rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Accordion type="multiple">
                          {Object.entries(SKILL_CATEGORIES).map(([category, skillKeys]) => {
                            const categoryDelta = skillKeys.reduce((sum, key) => sum + (comparison.deltas[key] || 0), 0) / skillKeys.length
                            return (
                              <AccordionItem key={category} value={category}>
                                <AccordionTrigger className="font-semibold">
                                  <div className="flex items-center gap-2">
                                    <span>{category}</span>
                                    <span className={`text-sm ${getDeltaColor(categoryDelta)}`}>
                                      {categoryDelta > 0 ? '+' : ''}
                                      {categoryDelta.toFixed(1)}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3 pt-2">
                                    {skillKeys.map((skillKey) => {
                                      const delta = comparison.deltas[skillKey] || 0
                                      const v1Value = comparison.version1[skillKey as keyof SkillsHistory] as number || 0
                                      const v2Value = comparison.version2[skillKey as keyof SkillsHistory] as number || 0
                                      return (
                                        <div key={skillKey} className="flex items-center justify-between p-2 rounded border">
                                          <span className="text-sm font-medium">{SKILL_LABELS[skillKey]}</span>
                                          <div className="flex items-center gap-4">
                                            <span className="text-sm text-muted-foreground w-8">{v1Value}</span>
                                            <span className="text-sm text-muted-foreground">→</span>
                                            <span className="text-sm text-muted-foreground w-8">{v2Value}</span>
                                            <span className={`flex items-center gap-1 w-12 ${getDeltaColor(delta)}`}>
                                              {getDeltaIcon(delta)}
                                              <span className="text-sm font-medium">
                                                {delta > 0 ? '+' : ''}
                                                {delta}
                                              </span>
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )
                          })}
                        </Accordion>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline View */}
                <Card>
                  <CardHeader>
                    <CardTitle>Version History</CardTitle>
                    <CardDescription>All published skill snapshots</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <p className="text-sm text-muted-foreground">Loading history...</p>
                    ) : history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No history yet. Publish a snapshot to create a version.</p>
                    ) : (
                      <div className="space-y-4">
                        {history.map((version, index) => {
                          const previousVersion = index < history.length - 1 ? history[index + 1] : null
                          const delta = previousVersion
                            ? (version.overall_rating || 0) - (previousVersion.overall_rating || 0)
                            : null
                          return (
                            <div key={version.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="font-semibold">
                                    {formatDate(version.version_date)}
                                    {index === 0 && <Badge variant="outline" className="ml-2">Latest</Badge>}
                                  </div>
                                  {version.version_name && (
                                    <div className="text-sm text-muted-foreground mt-1">{version.version_name}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-sm text-muted-foreground">Overall Rating</div>
                                    <div className="text-lg font-bold">{version.overall_rating?.toFixed(1) || 0}/3.0</div>
                                  </div>
                                  {delta !== null && (
                                    <div className={`flex items-center gap-1 ${getDeltaColor(delta)}`}>
                                      {getDeltaIcon(delta)}
                                      <span className="font-medium">
                                        {delta > 0 ? '+' : ''}
                                        {delta.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Accordion type="single" collapsible>
                                <AccordionItem value={version.id}>
                                  <AccordionTrigger className="text-sm">View Details</AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-4 pt-2">
                                      {Object.entries(SKILL_CATEGORIES).map(([category, skillKeys]) => {
                                        const average = calculateCategoryAverage(category, version)
                                        return (
                                          <div key={category} className="border rounded p-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm font-semibold">{category}</span>
                                              <span className="text-sm font-medium">{average.toFixed(1)}/3</span>
                                            </div>
                                            <div className="space-y-2">
                                              {skillKeys.map((skillKey) => {
                                                const rating = version[skillKey as keyof SkillsHistory] as number || 0
                                                return (
                                                  <div key={skillKey} className="flex items-center justify-between text-sm">
                                                    <span>{SKILL_LABELS[skillKey]}</span>
                                                    <span>{rating}/3</span>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Skills Snapshot</DialogTitle>
            <DialogDescription>
              This will save the current skills as a historical record. You can add an optional name to identify this version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="version-name">Version Name (optional)</Label>
              <Input
                id="version-name"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g., Q1 2026 Review"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={isLoading}>
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
