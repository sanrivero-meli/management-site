import type {
  Project,
  TeamMemberWithSkills,
  SuggestedAssignment,
  Skills,
  SkillRequirement,
  AssignmentRole,
  MemberPerformanceProject,
} from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKILL_KEYS = [
  'pensamiento_critico', 'vision_sistemica', 'argumentacion_facilitacion',
  'adopcion_ai_nuevas_tecnologias', 'conocimiento_usuario', 'problem_framing_briefing',
  'ideacion_prototipado', 'user_journey_flow', 'propuestas_out_of_the_box',
  'principios_diseno', 'sistema_diseno', 'visual_polishing',
  'escritura_ux', 'narrativa_estrategia', 'sistema_contenidos',
] as const

const WEIGHTS = {
  skill: 0.35,
  seniority: 0.15,
  capacity: 0.10,
  motivation: 0.10,
  experience: 0.15,
  growth: 0.15,
}

const PRIORITY_ORDER: Record<string, number> = {
  'HIT': 1, 'Carryover': 2, 'BAU': 3, 'World Class': 4, 'Quality': 5, 'Wishlist': 6,
}

// ---------------------------------------------------------------------------
// Input type for the v2 engine
// ---------------------------------------------------------------------------

export type AllocationInput = {
  projects: Project[]
  teamMembers: TeamMemberWithSkills[]
  existingAssignments: Array<{ team_member_id: string; sprints_allocated: number }>
  quarter: string
  performanceHistory: Map<string, MemberPerformanceProject[]>
  influenceMap: Map<string, Map<string, number>>
}

// ---------------------------------------------------------------------------
// Skill Match (weight 0.35)
// ---------------------------------------------------------------------------

function normalizeRequirements(
  skillRequirements: SkillRequirement[] | null,
  fallbackRequired: string[] | null
): SkillRequirement[] {
  if (skillRequirements && skillRequirements.length > 0) return skillRequirements
  return (fallbackRequired || []).map((s) => ({ skill: s, importance: 'must_have' as const }))
}

function computeSkillMatchV2(
  memberSkills: Skills | null,
  requirements: SkillRequirement[]
): { score: number; mustHaveCoverage: number; disqualified: boolean } {
  if (!memberSkills || requirements.length === 0) {
    return { score: 0, mustHaveCoverage: 0, disqualified: false }
  }

  let weightedScore = 0
  let totalWeight = 0
  let mustHaveMet = 0
  let mustHaveTotal = 0
  let mustHaveZeroCount = 0

  for (const req of requirements) {
    const raw = (memberSkills as Record<string, unknown>)[req.skill]
    const score = typeof raw === 'number' ? raw : 0
    const weight = req.importance === 'must_have' ? 1.0 : 0.5

    weightedScore += (score / 3) * weight
    totalWeight += weight

    if (req.importance === 'must_have') {
      mustHaveTotal++
      if (score > 0) mustHaveMet++
      else mustHaveZeroCount++
    }
  }

  const normalizedScore = totalWeight > 0 ? weightedScore / totalWeight : 0
  const mustHaveCoverage = mustHaveTotal > 0 ? mustHaveMet / mustHaveTotal : 1
  const disqualified = mustHaveZeroCount > 0

  // Harsh penalty per missing must-have: 0.3^N
  const penaltyMultiplier = disqualified ? Math.pow(0.3, mustHaveZeroCount) : 1.0

  return {
    score: normalizedScore * penaltyMultiplier,
    mustHaveCoverage,
    disqualified,
  }
}

// ---------------------------------------------------------------------------
// Complementarity-adjusted skill score (for contributor selection)
// ---------------------------------------------------------------------------

function complementaritySkillScore(
  memberSkills: Skills | null,
  requirements: SkillRequirement[],
  coveredSkills: Set<string>
): number {
  if (!memberSkills || requirements.length === 0) return 0

  let score = 0
  let totalWeight = 0

  for (const req of requirements) {
    const raw = (memberSkills as Record<string, unknown>)[req.skill]
    const s = typeof raw === 'number' ? raw : 0
    const weight = req.importance === 'must_have' ? 1.0 : 0.5

    if (coveredSkills.has(req.skill)) {
      // Already covered by lead — reduced credit
      score += (s / 3) * weight * 0.2
    } else {
      // Uncovered skill — bonus for filling the gap
      score += (s / 3) * weight * 1.3
    }
    totalWeight += weight
  }

  return totalWeight > 0 ? Math.min(1, score / totalWeight) : 0
}

// ---------------------------------------------------------------------------
// Seniority Fit (weight 0.15)
// ---------------------------------------------------------------------------

function seniorityMultiplier(memberLevel: number, projectComplexity: number | null): number {
  const complexity = projectComplexity || 2

  if (complexity === 3) {
    const weights: Record<number, number> = { 3: 1.0, 2: 0.8, 1: 0.5 }
    return weights[memberLevel] || 0.5
  }
  if (complexity === 1) {
    const weights: Record<number, number> = { 1: 1.5, 2: 1.2, 3: 1.0 }
    return weights[memberLevel] || 1.0
  }
  const weights: Record<number, number> = { 2: 1.2, 3: 1.0, 1: 1.0 }
  return weights[memberLevel] || 1.0
}

function seniorityScore(memberLevel: number, projectComplexity: number | null): number {
  return seniorityMultiplier(memberLevel, projectComplexity) / 1.5
}

// ---------------------------------------------------------------------------
// Motivation (weight 0.10)
// ---------------------------------------------------------------------------

function motivationScore(motivationLevel: number, projectComplexity: number | null): number {
  const complexity = projectComplexity || 2
  const norm = (motivationLevel - 1) / 4 // 0-1

  if (complexity === 3) return norm
  if (complexity === 1) return 1 - norm * 0.3
  return 0.5 + norm * 0.3
}

// ---------------------------------------------------------------------------
// Historical Experience (weight 0.15)
// ---------------------------------------------------------------------------

function experienceScore(
  memberHistory: MemberPerformanceProject[],
  projectSkillKeys: string[]
): number {
  if (!memberHistory || memberHistory.length === 0 || projectSkillKeys.length === 0) {
    return 0.3 // neutral baseline
  }

  const relevant = memberHistory.filter((h) => {
    if (h.status !== 'Complete' && h.status !== 'Active') return false
    return (h.related_skills || []).some((s) => projectSkillKeys.includes(s))
  })

  if (relevant.length === 0) return 0.3

  const completed = relevant.filter((p) => p.status === 'Complete')
  const completionRate = completed.length / relevant.length

  const avgOverlap =
    relevant.reduce((sum, p) => {
      const overlap = (p.related_skills || []).filter((s) => projectSkillKeys.includes(s)).length
      return sum + overlap / projectSkillKeys.length
    }, 0) / relevant.length

  const now = Date.now()
  const recencyAvg =
    relevant.reduce((sum, p) => {
      const ageYears = (now - new Date(p.start_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      return sum + Math.max(0, 1 - ageYears / 3)
    }, 0) / relevant.length

  return Math.min(1, completionRate * 0.4 + avgOverlap * 0.4 + recencyAvg * 0.2)
}

// ---------------------------------------------------------------------------
// Growth Opportunity (weight 0.15)
// ---------------------------------------------------------------------------

function growthScore(
  memberSkills: Skills | null,
  requirements: SkillRequirement[],
  memberLevel: number,
  projectComplexity: number | null
): number {
  if (!memberSkills || requirements.length === 0) return 0

  const growthSkills = requirements.filter((req) => {
    const raw = (memberSkills as Record<string, unknown>)[req.skill]
    return typeof raw === 'number' && raw === 1 // beginner
  })

  const growthRatio = growthSkills.length / requirements.length

  // Bell curve peaking at ~25% growth skills
  const bellCurve = Math.exp(-Math.pow((growthRatio - 0.25) / 0.2, 2))

  const complexity = projectComplexity || 2
  const levelFactor =
    memberLevel === 1 && complexity <= 2
      ? 1.2
      : memberLevel === 2 && complexity === 3
        ? 1.1
        : 1.0

  return Math.min(1, bellCurve * levelFactor)
}

// ---------------------------------------------------------------------------
// Composite Score
// ---------------------------------------------------------------------------

type ScoreFactors = {
  skill: number
  seniority: number
  capacity: number
  motivation: number
  experience: number
  growth: number
}

function compositeScore(f: ScoreFactors): number {
  return (
    f.skill * WEIGHTS.skill +
    f.seniority * WEIGHTS.seniority +
    f.capacity * WEIGHTS.capacity +
    f.motivation * WEIGHTS.motivation +
    f.experience * WEIGHTS.experience +
    f.growth * WEIGHTS.growth
  )
}

// ---------------------------------------------------------------------------
// Team size auto-suggest
// ---------------------------------------------------------------------------

function suggestTeamSize(project: Project): number {
  if (project.team_size !== null && project.team_size !== undefined) return project.team_size
  const sprints = Number(project.estimated) || 0
  return sprints > 8 ? 2 : 1
}

// ---------------------------------------------------------------------------
// Sprint split for lead/contributor
// ---------------------------------------------------------------------------

function computeSprintSplit(totalSprints: number, teamSize: number): { lead: number; contributor: number } {
  if (teamSize <= 1) return { lead: totalSprints, contributor: 0 }
  const leadFraction = 0.6
  const lead = Math.round(totalSprints * leadFraction * 2) / 2 // round to 0.5
  const contributor = Math.round((totalSprints - lead) * 2) / 2
  return { lead, contributor }
}

// ---------------------------------------------------------------------------
// Score a single member for a project
// ---------------------------------------------------------------------------

type MemberScore = {
  member: TeamMemberWithSkills
  factors: ScoreFactors
  composite: number
  mustHaveCoverage: number
  disqualified: boolean
  remaining: number
}

function scoreMember(
  member: TeamMemberWithSkills,
  project: Project,
  requirements: SkillRequirement[],
  sprintsForRole: number,
  remainingCapacity: number,
  history: MemberPerformanceProject[],
  ownerBonus: boolean
): MemberScore {
  const skillMatch = computeSkillMatchV2(member.skills, requirements)

  const skillKeys = requirements.map((r) => r.skill)

  const factors: ScoreFactors = {
    skill: skillMatch.score,
    seniority: seniorityScore(member.level, project.complexity),
    capacity: remainingCapacity >= sprintsForRole ? 1.0 : remainingCapacity / sprintsForRole,
    motivation: motivationScore(member.motivation_level, project.complexity),
    experience: experienceScore(history, skillKeys),
    growth: growthScore(member.skills, requirements, member.level, project.complexity),
  }

  let score = compositeScore(factors)
  if (ownerBonus) score = Math.min(1, score + 0.15)

  return {
    member,
    factors,
    composite: score,
    mustHaveCoverage: skillMatch.mustHaveCoverage,
    disqualified: skillMatch.disqualified,
    remaining: remainingCapacity,
  }
}

// ---------------------------------------------------------------------------
// Get skills well-covered by a member (score >= 2)
// ---------------------------------------------------------------------------

function getCoveredSkills(memberSkills: Skills | null, requirements: SkillRequirement[]): Set<string> {
  const covered = new Set<string>()
  if (!memberSkills) return covered
  for (const req of requirements) {
    const raw = (memberSkills as Record<string, unknown>)[req.skill]
    if (typeof raw === 'number' && raw >= 2) covered.add(req.skill)
  }
  return covered
}

// ---------------------------------------------------------------------------
// Global score for swap optimizer
// ---------------------------------------------------------------------------

function computeGlobalScore(
  assignments: SuggestedAssignment[],
  projects: Project[],
  members: TeamMemberWithSkills[],
  memberCapacity: Record<string, number>
): number {
  const totalConfidence = assignments.reduce((sum, a) => sum + a.confidence_score, 0)

  // Balance penalty: std deviation of sprint usage
  const sprintsByMember: Record<string, number> = {}
  members.forEach((m) => { sprintsByMember[m.id] = 12 - (memberCapacity[m.id] ?? 12) })
  // Add assignment sprints (these are the new suggestions on top of existing)
  assignments.forEach((a) => {
    sprintsByMember[a.team_member_id] = (sprintsByMember[a.team_member_id] || 0) + a.sprints_allocated
  })
  const usages = Object.values(sprintsByMember)
  const mean = usages.reduce((a, b) => a + b, 0) / (usages.length || 1)
  const variance = usages.reduce((sum, u) => sum + Math.pow(u - mean, 2), 0) / (usages.length || 1)
  const balancePenalty = Math.sqrt(variance) * 0.1

  // Starvation penalty: eligible projects without assignment
  const assignedProjects = new Set(assignments.map((a) => a.project_id))
  const unassignedEligible = projects.filter(
    (p) =>
      !assignedProjects.has(p.id) &&
      ((p.required_skills && p.required_skills.length > 0) || (p.skill_requirements && p.skill_requirements.length > 0)) &&
      p.estimated &&
      p.estimated > 0
  )
  const starvationPenalty = unassignedEligible.length * 0.5

  return totalConfidence - balancePenalty - starvationPenalty
}

// ---------------------------------------------------------------------------
// Swap optimizer
// ---------------------------------------------------------------------------

function optimizeBySwaps(
  initial: SuggestedAssignment[],
  projects: Project[],
  members: TeamMemberWithSkills[],
  baseCapacity: Record<string, number>,
  input: AllocationInput
): SuggestedAssignment[] {
  const current = [...initial]
  let currentGlobalScore = computeGlobalScore(current, projects, members, baseCapacity)
  let improved = true
  let iteration = 0
  const maxIterations = 200

  while (improved && iteration < maxIterations) {
    improved = false
    iteration++

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        // Only swap same role
        if (current[i].role !== current[j].role) continue
        // Don't swap if same project (multi-member)
        if (current[i].project_id === current[j].project_id) continue
        // Don't swap if same member
        if (current[i].team_member_id === current[j].team_member_id) continue

        // Try swapping members
        const candidate = current.map((x, idx) => {
          if (idx === i) return { ...x, team_member_id: current[j].team_member_id }
          if (idx === j) return { ...x, team_member_id: current[i].team_member_id }
          return x
        })

        // Validate capacity: check total sprints per member don't exceed 12
        const sprintTotals: Record<string, number> = {}
        members.forEach((m) => { sprintTotals[m.id] = 12 - (baseCapacity[m.id] ?? 12) })
        let valid = true
        for (const a of candidate) {
          sprintTotals[a.team_member_id] = (sprintTotals[a.team_member_id] || 0) + a.sprints_allocated
          if (sprintTotals[a.team_member_id] > 12) { valid = false; break }
        }
        if (!valid) continue

        // Rescore the two swapped assignments
        const projectI = projects.find((p) => p.id === candidate[i].project_id)
        const projectJ = projects.find((p) => p.id === candidate[j].project_id)
        const memberI = members.find((m) => m.id === candidate[i].team_member_id)
        const memberJ = members.find((m) => m.id === candidate[j].team_member_id)

        if (projectI && projectJ && memberI && memberJ) {
          const reqI = normalizeRequirements(projectI.skill_requirements, projectI.required_skills)
          const reqJ = normalizeRequirements(projectJ.skill_requirements, projectJ.required_skills)
          const histI = input.performanceHistory.get(memberI.id) || []
          const histJ = input.performanceHistory.get(memberJ.id) || []
          const ownerI = (projectI.owners || []).includes(memberI.id)
          const ownerJ = (projectJ.owners || []).includes(memberJ.id)

          const scoreI = scoreMember(memberI, projectI, reqI, candidate[i].sprints_allocated, 12, histI, ownerI)
          const scoreJ = scoreMember(memberJ, projectJ, reqJ, candidate[j].sprints_allocated, 12, histJ, ownerJ)

          candidate[i] = {
            ...candidate[i],
            confidence_score: Math.round(scoreI.composite * 100) / 100,
            match_details: buildMatchDetails(scoreI, 0),
          }
          candidate[j] = {
            ...candidate[j],
            confidence_score: Math.round(scoreJ.composite * 100) / 100,
            match_details: buildMatchDetails(scoreJ, 0),
          }
        }

        const candidateGlobalScore = computeGlobalScore(candidate, projects, members, baseCapacity)
        if (candidateGlobalScore > currentGlobalScore + 0.001) {
          // Apply swap
          current[i] = candidate[i]
          current[j] = candidate[j]
          currentGlobalScore = candidateGlobalScore
          improved = true
          break
        }
      }
      if (improved) break
    }
  }

  return current
}

// ---------------------------------------------------------------------------
// Build match details helper
// ---------------------------------------------------------------------------

function buildMatchDetails(
  scored: MemberScore,
  complementarityScore: number
): SuggestedAssignment['match_details'] {
  return {
    skill_score: Math.round(scored.factors.skill * 100) / 100,
    must_have_coverage: Math.round(scored.mustHaveCoverage * 100) / 100,
    capacity_remaining: scored.remaining,
    seniority_fit: `Level ${scored.member.level} for complexity ${scored.factors.seniority > 0.66 ? 'High' : scored.factors.seniority > 0.33 ? 'Medium' : 'Low'}`,
    motivation_bonus: Math.round(scored.factors.motivation * 100) / 100,
    experience_bonus: Math.round(scored.factors.experience * 100) / 100,
    complementarity_score: Math.round(complementarityScore * 100) / 100,
  }
}

// ---------------------------------------------------------------------------
// Main engine: v2
// ---------------------------------------------------------------------------

export function generateSuggestionsV2(input: AllocationInput): SuggestedAssignment[] {
  const { projects, teamMembers, existingAssignments, performanceHistory, influenceMap } = input

  // 1. PREPARE — compute remaining capacity
  const usedSprints: Record<string, number> = {}
  existingAssignments.forEach((a) => {
    usedSprints[a.team_member_id] = (usedSprints[a.team_member_id] || 0) + Number(a.sprints_allocated)
  })
  const memberCapacity: Record<string, number> = {}
  teamMembers.forEach((m) => {
    memberCapacity[m.id] = 12 - (usedSprints[m.id] || 0)
  })

  // Save base capacity for swap optimizer
  const baseCapacity = { ...memberCapacity }

  // Filter eligible projects
  const eligible = projects.filter((p) => {
    const hasSkills =
      (p.skill_requirements && p.skill_requirements.length > 0) ||
      (p.required_skills && p.required_skills.length > 0)
    const hasEstimate = p.estimated && p.estimated > 0
    return hasSkills && hasEstimate
  })

  // Sort by priority
  eligible.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority || 'BAU'] || 99
    const pb = PRIORITY_ORDER[b.priority || 'BAU'] || 99
    return pa - pb
  })

  // 2. GREEDY PASS
  const suggestions: SuggestedAssignment[] = []

  for (const project of eligible) {
    const requirements = normalizeRequirements(project.skill_requirements, project.required_skills)
    const totalSprints = Number(project.estimated)
    const teamSize = suggestTeamSize(project)
    const split = computeSprintSplit(totalSprints, teamSize)

    // Score all members for lead role
    const leadCandidates = teamMembers
      .map((member) => {
        const remaining = memberCapacity[member.id] || 0
        if (remaining <= 0) return null
        const history = performanceHistory.get(member.id) || []
        const isOwner = (project.owners || []).includes(member.id)
        return scoreMember(member, project, requirements, split.lead, remaining, history, isOwner)
      })
      .filter((s): s is MemberScore => s !== null)
      .sort((a, b) => {
        // Prefer non-disqualified members
        if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1
        return b.composite - a.composite
      })

    if (leadCandidates.length === 0) continue

    const lead = leadCandidates[0]
    const leadSprints = Math.min(split.lead, lead.remaining)

    suggestions.push({
      project_id: project.id,
      team_member_id: lead.member.id,
      sprints_allocated: leadSprints,
      confidence_score: Math.round(lead.composite * 100) / 100,
      role: 'lead',
      match_details: buildMatchDetails(lead, 0),
    })

    memberCapacity[lead.member.id] = (memberCapacity[lead.member.id] || 0) - leadSprints

    // Select contributor if team_size = 2
    if (teamSize >= 2 && split.contributor > 0) {
      const coveredSkills = getCoveredSkills(lead.member.skills, requirements)

      const contribCandidates = teamMembers
        .filter((m) => m.id !== lead.member.id)
        .map((member) => {
          const remaining = memberCapacity[member.id] || 0
          if (remaining <= 0) return null

          const history = performanceHistory.get(member.id) || []
          const isOwner = (project.owners || []).includes(member.id)
          const scored = scoreMember(member, project, requirements, split.contributor, remaining, history, isOwner)

          // Replace skill score with complementarity-adjusted score
          const compScore = complementaritySkillScore(member.skills, requirements, coveredSkills)
          const adjustedFactors = { ...scored.factors, skill: compScore }
          const adjustedComposite = compositeScore(adjustedFactors)

          // Influence bonus: if lead works well with this person
          const leadInfluence = influenceMap.get(lead.member.id)
          const influenceBonus = leadInfluence
            ? ((leadInfluence.get(member.id) || 0) / 5) * 0.05
            : 0

          return {
            ...scored,
            factors: adjustedFactors,
            composite: Math.min(1, adjustedComposite + influenceBonus),
            complementarityScore: compScore,
          }
        })
        .filter((s): s is MemberScore & { complementarityScore: number } => s !== null)
        .sort((a, b) => b.composite - a.composite)

      if (contribCandidates.length > 0) {
        const contrib = contribCandidates[0]
        const contribSprints = Math.min(split.contributor, contrib.remaining)

        suggestions.push({
          project_id: project.id,
          team_member_id: contrib.member.id,
          sprints_allocated: contribSprints,
          confidence_score: Math.round(contrib.composite * 100) / 100,
          role: 'contributor',
          match_details: buildMatchDetails(contrib, contrib.complementarityScore),
        })

        memberCapacity[contrib.member.id] = (memberCapacity[contrib.member.id] || 0) - contribSprints
      }
    }
  }

  // 3. SWAP OPTIMIZATION
  const optimized = optimizeBySwaps(suggestions, eligible, teamMembers, baseCapacity, input)

  // 4. RESCUE PASS — try to assign any remaining eligible projects
  const assignedProjects = new Set(optimized.map((a) => a.project_id))
  for (const project of eligible) {
    if (assignedProjects.has(project.id)) continue

    const requirements = normalizeRequirements(project.skill_requirements, project.required_skills)
    const totalSprints = Number(project.estimated)

    // Recompute remaining capacity after optimization
    const postOptCapacity: Record<string, number> = { ...baseCapacity }
    for (const a of optimized) {
      postOptCapacity[a.team_member_id] = (postOptCapacity[a.team_member_id] || 0) - a.sprints_allocated
    }

    const rescue = teamMembers
      .filter((m) => (postOptCapacity[m.id] || 0) >= 1)
      .map((m) => {
        const remaining = postOptCapacity[m.id] || 0
        const history = performanceHistory.get(m.id) || []
        const isOwner = (project.owners || []).includes(m.id)
        return scoreMember(m, project, requirements, totalSprints, remaining, history, isOwner)
      })
      .sort((a, b) => b.composite - a.composite)

    if (rescue.length > 0) {
      const best = rescue[0]
      const allocSprints = Math.min(totalSprints, best.remaining)

      optimized.push({
        project_id: project.id,
        team_member_id: best.member.id,
        sprints_allocated: allocSprints,
        confidence_score: Math.min(0.29, Math.round(best.composite * 100) / 100), // cap at low confidence
        role: 'lead',
        match_details: buildMatchDetails(best, 0),
      })
    }
  }

  return optimized
}

// ---------------------------------------------------------------------------
// Backward-compatible wrapper (old signature)
// ---------------------------------------------------------------------------

export function generateSuggestions(
  projects: Project[],
  teamMembers: TeamMemberWithSkills[],
  existingAssignments: Array<{ team_member_id: string; sprints_allocated: number }>,
  quarter: string
): SuggestedAssignment[] {
  return generateSuggestionsV2({
    projects,
    teamMembers,
    existingAssignments,
    quarter,
    performanceHistory: new Map(),
    influenceMap: new Map(),
  })
}

// ---------------------------------------------------------------------------
// Utility exports (unchanged API)
// ---------------------------------------------------------------------------

export function getProjectWarnings(project: Project): string[] {
  const warnings: string[] = []
  if (
    (!project.required_skills || project.required_skills.length === 0) &&
    (!project.skill_requirements || project.skill_requirements.length === 0)
  ) {
    warnings.push('Missing required skills')
  }
  if (!project.estimated || project.estimated <= 0) {
    warnings.push('Missing sprint estimate')
  }
  return warnings
}

export function getMemberTopSkills(
  skills: Skills | null,
  limit: number = 3
): Array<{ key: string; score: number }> {
  if (!skills) return []

  return SKILL_KEYS
    .map((key) => ({
      key,
      score: typeof (skills as Record<string, unknown>)[key] === 'number'
        ? ((skills as Record<string, unknown>)[key] as number)
        : 0,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export { suggestTeamSize }
