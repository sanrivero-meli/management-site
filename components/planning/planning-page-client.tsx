'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { announce } from '@/lib/utils'
import {
  fetchJiraEpics,
  syncEpicsToProjects,
  saveAssignments,
  updateProjectPlanningFields,
  updateJiraStatus,
  deleteAssignment,
} from '@/app/actions/planning'
import { generateSuggestionsV2, getProjectWarnings, getMemberTopSkills, suggestTeamSize } from '@/lib/allocation-engine'
import type {
  Project,
  TeamMemberWithSkills,
  AssignmentWithDetails,
  SuggestedAssignment,
  SkillRequirement,
  MemberPerformanceProject,
} from '@/types'
import {
  SKILL_LABELS,
  QUARTERS,
  SPRINTS_PER_QUARTER,
  COMPLEXITY_LABELS,
  PROJECT_STATUSES,
} from '@/types'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SkillMultiSelect } from '@/components/ui/skill-multi-select'
import {
  RefreshCw,
  Wand2,
  Save,
  AlertTriangle,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Star,
} from 'lucide-react'

interface CapacityMember {
  id: string
  name: string
  seniority: string
  level: number
  used_sprints: number
  remaining_sprints: number
}

interface PlanningPageClientProps {
  quarter: string
  teamWithSkills: TeamMemberWithSkills[]
  assignments: AssignmentWithDetails[]
  capacity: CapacityMember[]
  projects: Project[]
  performanceHistory: Record<string, MemberPerformanceProject[]>
  influenceMap: Record<string, Record<string, number>>
}

export function PlanningPageClient({
  quarter,
  teamWithSkills,
  assignments,
  capacity,
  projects,
  performanceHistory,
  influenceMap,
}: PlanningPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [suggestions, setSuggestions] = useState<SuggestedAssignment[]>([])
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Projects not yet assigned this quarter
  const assignedProjectIds = new Set(assignments.map((a) => a.project_id))
  const unassignedProjects = projects.filter((p) => !assignedProjectIds.has(p.id))
  const projectsWithWarnings = projects.filter((p) => getProjectWarnings(p).length > 0)

  // ─── Helpers to reconstruct Maps from serialized data ───

  function buildPerformanceMap(): Map<string, MemberPerformanceProject[]> {
    const map = new Map<string, MemberPerformanceProject[]>()
    for (const [key, value] of Object.entries(performanceHistory)) {
      map.set(key, value)
    }
    return map
  }

  function buildInfluenceMap(): Map<string, Map<string, number>> {
    const map = new Map<string, Map<string, number>>()
    for (const [source, targets] of Object.entries(influenceMap)) {
      const inner = new Map<string, number>()
      for (const [target, level] of Object.entries(targets)) {
        inner.set(target, level)
      }
      map.set(source, inner)
    }
    return map
  }

  // ─── Handlers ──────────────────────────────

  function handleQuarterChange(newQuarter: string) {
    router.push(`/planning?quarter=${encodeURIComponent(newQuarter)}`)
  }

  function showStatus(text: string, type: 'success' | 'error') {
    setStatusMessage({ text, type })
    announce(text)
    setTimeout(() => setStatusMessage(null), 5000)
  }

  function handleJiraSync() {
    startTransition(async () => {
      try {
        setStatusMessage({ text: 'Fetching epics from Jira...', type: 'success' })
        const jiraResult = await fetchJiraEpics()
        if (jiraResult.error || !jiraResult.epics) {
          showStatus(jiraResult.error || 'No epics returned', 'error')
          return
        }
        const result = await syncEpicsToProjects(jiraResult.epics)
        if (result.errors.length > 0) {
          showStatus(`Synced ${result.created} new, ${result.updated} updated. ${result.errors.length} errors.`, 'error')
        } else {
          showStatus(`Synced from Jira: ${result.created} new, ${result.updated} updated`, 'success')
        }
        router.refresh()
      } catch (err) {
        showStatus(`Jira sync error: ${String(err)}`, 'error')
      }
    })
  }

  function handleAutoAssign() {
    const results = generateSuggestionsV2({
      projects,
      teamMembers: teamWithSkills,
      existingAssignments: assignments.map((a) => ({
        team_member_id: a.team_member_id,
        sprints_allocated: a.sprints_allocated,
      })),
      quarter,
      performanceHistory: buildPerformanceMap(),
      influenceMap: buildInfluenceMap(),
    })
    setSuggestions(results)
    announce(`Generated ${results.length} assignment suggestions`)
  }

  function handleSavePlan() {
    if (suggestions.length === 0) return
    startTransition(async () => {
      const result = await saveAssignments(
        suggestions.map((a) => ({
          project_id: a.project_id,
          team_member_id: a.team_member_id,
          sprints_allocated: a.sprints_allocated,
          quarter,
          role: a.role,
        }))
      )
      if (result.error) {
        announce(result.error)
      } else {
        announce(`Saved ${result.count} assignments`)
        setSuggestions([])
        router.refresh()
      }
    })
  }

  function handleRemoveSuggestion(projectId: string) {
    setSuggestions((prev) => prev.filter((s) => s.project_id !== projectId))
  }

  function handleDeleteAssignment(assignmentId: string) {
    startTransition(async () => {
      const result = await deleteAssignment(assignmentId)
      if (result.error) {
        announce(result.error)
      } else {
        announce('Assignment removed')
        router.refresh()
      }
    })
  }

  function handleStatusChange(projectId: string, jiraKey: string | null, newStatus: string) {
    if (!jiraKey) return
    startTransition(async () => {
      const result = await updateJiraStatus(projectId, jiraKey, newStatus)
      if (result.error) {
        showStatus(result.error, 'error')
      } else {
        showStatus(`Status updated to "${newStatus}"`, 'success')
        router.refresh()
      }
    })
  }

  function handleSkillsChange(projectId: string, skills: string[]) {
    startTransition(async () => {
      // Build skill_requirements from skills + existing importance data
      const project = projects.find((p) => p.id === projectId)
      const existingReqs = project?.skill_requirements || []
      const newReqs: SkillRequirement[] = skills.map((skill) => {
        const existing = existingReqs.find((r) => r.skill === skill)
        return existing || { skill, importance: 'must_have' as const }
      })
      await updateProjectPlanningFields(projectId, {
        required_skills: skills,
        skill_requirements: newReqs,
      })
      router.refresh()
    })
  }

  function handleSkillImportanceToggle(projectId: string, skill: string) {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    startTransition(async () => {
      const reqs = [...(project.skill_requirements || [])]
      const idx = reqs.findIndex((r) => r.skill === skill)
      if (idx >= 0) {
        reqs[idx] = {
          ...reqs[idx],
          importance: reqs[idx].importance === 'must_have' ? 'nice_to_have' : 'must_have',
        }
      }
      await updateProjectPlanningFields(projectId, { skill_requirements: reqs })
      router.refresh()
    })
  }

  function handleComplexityChange(projectId: string, complexity: string) {
    startTransition(async () => {
      await updateProjectPlanningFields(projectId, { complexity: parseInt(complexity) })
      router.refresh()
    })
  }

  function handleSprintsChange(projectId: string, value: string) {
    const sprints = parseFloat(value)
    if (isNaN(sprints) || sprints < 0) return
    startTransition(async () => {
      await updateProjectPlanningFields(projectId, { estimated: sprints })
      router.refresh()
    })
  }

  function handleTeamSizeChange(projectId: string, value: string) {
    const size = value === 'auto' ? null : parseInt(value)
    startTransition(async () => {
      await updateProjectPlanningFields(projectId, { team_size: size })
      router.refresh()
    })
  }

  // ─── Helpers ───────────────────────────────

  function getProjectName(projectId: string) {
    return projects.find((p) => p.id === projectId)?.name || 'Unknown'
  }

  function getMemberName(memberId: string) {
    return teamWithSkills.find((m) => m.id === memberId)?.name || 'Unknown'
  }

  function priorityVariant(priority: string | null) {
    switch (priority) {
      case 'HIT': return 'negative' as const
      case 'Carryover': return 'caution' as const
      case 'BAU': return 'secondary' as const
      case 'World Class': return 'informative' as const
      default: return 'outline' as const
    }
  }

  // Group suggestions by project for multi-member display
  function groupSuggestionsByProject(sugs: SuggestedAssignment[]): Map<string, SuggestedAssignment[]> {
    const grouped = new Map<string, SuggestedAssignment[]>()
    for (const s of sugs) {
      if (!grouped.has(s.project_id)) grouped.set(s.project_id, [])
      grouped.get(s.project_id)!.push(s)
    }
    return grouped
  }

  const suggestionsGrouped = groupSuggestionsByProject(suggestions)

  // ─── Render ────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quarterly Planning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign projects to team members based on skills and capacity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={quarter} onValueChange={handleQuarterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleJiraSync}
          disabled={isPending}
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          Sync from Jira
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoAssign}
          disabled={isPending}
        >
          <Wand2 className="h-4 w-4" />
          Auto-assign
        </Button>
        {suggestions.length > 0 && (
          <Button
            size="sm"
            onClick={handleSavePlan}
            disabled={isPending}
          >
            <Save className="h-4 w-4" />
            Save plan ({suggestions.length})
          </Button>
        )}
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
          statusMessage.type === 'error'
            ? 'border-[rgb(237,49,74)]/30 bg-[rgba(158,0,21,0.1)] text-[rgb(237,49,74)]'
            : 'border-primary/30 bg-[rgba(67,76,228,0.1)] text-primary'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Warning banner */}
      {projectsWithWarnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-[rgba(215,64,9,0.08)] p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(240,87,5)]" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {projectsWithWarnings.length} project{projectsWithWarnings.length > 1 ? 's' : ''} can&apos;t be auto-assigned
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Set required skills and sprint estimates to enable auto-assignment.
            </p>
          </div>
        </div>
      )}

      {/* Three-column grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Project Queue */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-foreground">
            Projects ({unassignedProjects.length} unassigned)
          </h2>
          {unassignedProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">All projects are assigned.</p>
          )}
          {unassignedProjects.map((project) => {
            const warnings = getProjectWarnings(project)
            const isExpanded = expandedProject === project.id
            const autoTeamSize = suggestTeamSize(project)
            const skillReqs = project.skill_requirements || []
            return (
              <Card key={project.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-foreground">
                          {project.name}
                        </h3>
                        {project.jira_key && project.jira_link && (
                          <a
                            href={project.jira_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {project.jira_key && (
                          <span className="text-xs text-muted-foreground">{project.jira_key}</span>
                        )}
                        {project.priority && (
                          <Badge variant={priorityVariant(project.priority)} className="text-[10px]">
                            {project.priority}
                          </Badge>
                        )}
                        {autoTeamSize > 1 && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Users className="h-2.5 w-2.5" />
                            {autoTeamSize}
                          </Badge>
                        )}
                        <Select
                          value={project.status}
                          onValueChange={(v) => handleStatusChange(project.id, project.jira_key, v)}
                          disabled={isPending || !project.jira_key}
                        >
                          <SelectTrigger className="h-5 w-auto gap-1 border-0 bg-transparent px-1.5 py-0 text-[10px] font-medium text-muted-foreground hover:text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Warnings */}
                  {warnings.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-[rgb(240,87,5)]">
                      <AlertTriangle className="h-3 w-3" />
                      {warnings.join(' · ')}
                    </div>
                  )}

                  {/* Inline summary when collapsed */}
                  {!isExpanded && (
                    <div className="flex flex-wrap gap-1">
                      {(project.required_skills || []).slice(0, 3).map((s) => {
                        const req = skillReqs.find((r) => r.skill === s)
                        const isMustHave = !req || req.importance === 'must_have'
                        return (
                          <Badge
                            key={s}
                            variant={isMustHave ? 'secondary' : 'outline'}
                            className="text-[10px]"
                          >
                            {SKILL_LABELS[s] || s}
                          </Badge>
                        )
                      })}
                      {(project.required_skills || []).length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{(project.required_skills || []).length - 3}
                        </Badge>
                      )}
                      {project.estimated && (
                        <Badge variant="outline" className="text-[10px]">
                          {project.estimated}sp
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Expanded editing */}
                  {isExpanded && (
                    <div className="space-y-3 border-t border-border pt-3">
                      <SkillMultiSelect
                        label="Required Skills"
                        selectedSkills={project.required_skills || []}
                        onSkillsChange={(skills) => handleSkillsChange(project.id, skills)}
                        namePrefix={`project-${project.id}-skills`}
                      />

                      {/* Skill importance toggles */}
                      {(project.required_skills || []).length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Skill Importance</label>
                          <div className="flex flex-wrap gap-1">
                            {(project.required_skills || []).map((skill) => {
                              const req = skillReqs.find((r) => r.skill === skill)
                              const isMustHave = !req || req.importance === 'must_have'
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
                                    isMustHave
                                      ? 'border-primary/30 bg-primary/10 text-primary'
                                      : 'border-border bg-transparent text-muted-foreground'
                                  }`}
                                  onClick={() => handleSkillImportanceToggle(project.id, skill)}
                                  disabled={isPending}
                                >
                                  {isMustHave && <Star className="h-2.5 w-2.5 fill-current" />}
                                  {SKILL_LABELS[skill] || skill}
                                  <span className="opacity-60">{isMustHave ? 'must' : 'nice'}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Complexity</label>
                          <Select
                            value={project.complexity?.toString() || ''}
                            onValueChange={(v) => handleComplexityChange(project.id, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Set..." />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3].map((c) => (
                                <SelectItem key={c} value={c.toString()}>
                                  {COMPLEXITY_LABELS[c]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Sprints</label>
                          <Input
                            type="number"
                            min={0}
                            max={SPRINTS_PER_QUARTER}
                            step={0.5}
                            defaultValue={project.estimated || ''}
                            className="h-8 text-xs"
                            onBlur={(e) => handleSprintsChange(project.id, e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Team Size</label>
                          <Select
                            value={project.team_size?.toString() || 'auto'}
                            onValueChange={(v) => handleTeamSizeChange(project.id, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto ({autoTeamSize})</SelectItem>
                              <SelectItem value="1">1 person</SelectItem>
                              <SelectItem value="2">2 people</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Center: Team Capacity */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-foreground">
            Team Capacity
          </h2>
          {capacity.map((member) => {
            const memberSkills = teamWithSkills.find((m) => m.id === member.id)?.skills || null
            const topSkills = getMemberTopSkills(memberSkills)
            const usedPercent = (member.used_sprints / SPRINTS_PER_QUARTER) * 100

            return (
              <Card key={member.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{member.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {member.seniority} · Level {member.level}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">
                        {member.remaining_sprints}
                      </span>
                      <span className="text-xs text-muted-foreground"> / {SPRINTS_PER_QUARTER} free</span>
                    </div>
                  </div>

                  {/* Sprint capacity bar */}
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(usedPercent, 100)}%`,
                        backgroundColor: usedPercent >= 100
                          ? 'rgb(237,49,74)'
                          : usedPercent >= 75
                            ? 'rgb(240,87,5)'
                            : 'rgb(92,112,250)',
                      }}
                    />
                  </div>

                  {/* Top skills */}
                  {topSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {topSkills.map((s) => (
                        <Badge key={s.key} variant="secondary" className="text-[10px]">
                          {SKILL_LABELS[s.key] || s.key}
                          <span className="ml-0.5 opacity-60">{s.score}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Right: Current Plan */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-foreground">
            Current Plan ({assignments.length + suggestions.length})
          </h2>

          {/* Pending suggestions — grouped by project */}
          {suggestionsGrouped.size > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pending suggestions
              </h3>
              {Array.from(suggestionsGrouped.entries()).map(([projectId, projectSuggestions]) => (
                <Card key={`suggestion-${projectId}`} className="border-dashed border-primary/30">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="truncate text-sm font-medium text-foreground">
                        {getProjectName(projectId)}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveSuggestion(projectId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {projectSuggestions.map((s) => (
                      <div key={`${s.project_id}-${s.team_member_id}`} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            <Badge
                              variant={s.role === 'lead' ? 'informative' : 'outline'}
                              className="mr-1 text-[9px] px-1 py-0"
                            >
                              {s.role}
                            </Badge>
                            {getMemberName(s.team_member_id)} · {s.sprints_allocated}sp
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Skill: {Math.round(s.match_details.skill_score * 100)}%
                            {s.match_details.must_have_coverage < 1 && (
                              <span className="ml-1 text-[rgb(240,87,5)]">
                                (must-have gap)
                              </span>
                            )}
                            {s.match_details.experience_bonus > 0.3 && (
                              <span className="ml-1 text-primary">
                                · exp +{Math.round(s.match_details.experience_bonus * 100)}%
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge
                          variant={s.confidence_score >= 0.5 ? 'informative' : s.confidence_score >= 0.3 ? 'caution' : 'negative'}
                          className="text-[10px] shrink-0"
                        >
                          {Math.round(s.confidence_score * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Saved assignments */}
          {assignments.length > 0 && (
            <div className="space-y-2">
              {suggestions.length > 0 && (
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Saved assignments
                </h3>
              )}
              {assignments.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-medium text-foreground">
                          {a.project?.name || 'Unknown'}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {a.role && (
                            <Badge
                              variant={a.role === 'lead' ? 'informative' : 'outline'}
                              className="mr-1 text-[9px] px-1 py-0"
                            >
                              {a.role}
                            </Badge>
                          )}
                          {a.team_member?.name || 'Unknown'} · {a.sprints_allocated}sp
                        </p>
                        {a.project?.priority && (
                          <Badge variant={priorityVariant(a.project.priority)} className="mt-1 text-[10px]">
                            {a.project.priority}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteAssignment(a.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {assignments.length === 0 && suggestions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No assignments yet. Tag projects with skills and sprint estimates, then use Auto-assign.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
