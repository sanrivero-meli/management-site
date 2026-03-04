'use server'

import { createClient } from '@/lib/supabase/server'
import { SKILL_CATEGORIES } from '@/types'

export async function getDashboardMetrics() {
  const supabase = await createClient()

  // Get goals at risk (approaching target_date with status "Not Started" or "Blocked")
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const today = new Date().toISOString().split('T')[0]

  const { data: goalsAtRiskData } = await supabase
    .from('goals')
    .select('*')
    .in('status', ['Not Started', 'Blocked'])
    .lte('target_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .gte('target_date', today)

  const goalsAtRisk = goalsAtRiskData?.length || 0

  // Get all goals by status
  const { data: allGoals } = await supabase.from('goals').select('status')
  const goalsByStatus = allGoals?.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Get team members with motivation data
  const { data: teamData } = await supabase
    .from('team_members')
    .select('id, name, motivation_level')

  const avgMotivation =
    teamData && teamData.length > 0
      ? Math.round(
          (teamData.reduce((sum, m) => sum + m.motivation_level, 0) /
            teamData.length) *
            10
        ) / 10
      : 0

  // Get member motivations and low motivation members
  const memberMotivations = teamData?.map(m => ({
    id: m.id,
    name: m.name,
    motivation_level: m.motivation_level,
  })) || []

  const lowMotivationMembers = memberMotivations.filter(m => m.motivation_level <= 2)

  // Get influence distribution (static levels)
  const { data: influenceData } = await supabase
    .from('team_members')
    .select('influence_level')

  const influenceDistribution = influenceData?.reduce((acc, m) => {
    acc[m.influence_level] = (acc[m.influence_level] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  // Get influence relationships (for chord diagram)
  const { data: allTeamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .order('name')

  const { data: influenceRelationships } = await supabase
    .from('member_influence')
    .select('source_member_id, target_member_id, influence_level')

  // Build influence matrix for analytics
  const influenceMatrix: {
    members: string[]
    memberIds: string[]
    matrix: number[][]
  } = {
    members: [],
    memberIds: [],
    matrix: [],
  }

  if (allTeamMembers && allTeamMembers.length > 0) {
    // Create member index map
    const memberIndexMap = new Map<string, number>()
    allTeamMembers.forEach((member, index) => {
      memberIndexMap.set(member.id, index)
      influenceMatrix.members.push(member.name)
      influenceMatrix.memberIds.push(member.id)
    })

    // Initialize matrix with zeros
    const size = allTeamMembers.length
    influenceMatrix.matrix = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0))

    // Fill matrix with influence relationships
    if (influenceRelationships) {
      influenceRelationships.forEach((rel) => {
        const sourceIndex = memberIndexMap.get(rel.source_member_id)
        const targetIndex = memberIndexMap.get(rel.target_member_id)
        if (sourceIndex !== undefined && targetIndex !== undefined) {
          influenceMatrix.matrix[sourceIndex][targetIndex] = rel.influence_level
        }
      })
    }
  }

  // Get team skill averages by category
  const { data: allSkills } = await supabase.from('skills').select('*')

  const teamSkillAverages: Record<string, number> = {}

  if (allSkills && allSkills.length > 0) {
    Object.keys(SKILL_CATEGORIES).forEach((category) => {
      const skillKeys = SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES]
      let totalRating = 0
      let skillCount = 0

      // For each team member's skills
      allSkills.forEach((memberSkills) => {
        skillKeys.forEach((skillKey) => {
          const rating = memberSkills[skillKey as keyof typeof memberSkills] as number
          if (rating !== null && rating !== undefined && !isNaN(rating)) {
            totalRating += rating
            skillCount++
          }
        })
      })

      teamSkillAverages[category] = skillCount > 0
        ? Math.round((totalRating / skillCount) * 10) / 10
        : 0
    })
  }

  // Get skill trends (compare current vs last snapshot)
  const skillTrends: Record<string, number> = {}
  if (allSkills && allSkills.length > 0) {
    // Get latest skills history for each member
    const { data: skillsHistory } = await supabase
      .from('skills_history')
      .select('*')
      .order('version_date', { ascending: false })

    // Group by team_member_id and get latest
    const latestHistory = new Map<string, any>()
    if (skillsHistory) {
      skillsHistory.forEach((snapshot) => {
        if (!latestHistory.has(snapshot.team_member_id)) {
          latestHistory.set(snapshot.team_member_id, snapshot)
        }
      })
    }

    // Calculate trends for each category
    Object.keys(SKILL_CATEGORIES).forEach((category) => {
      const skillKeys = SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES]
      let totalDelta = 0
      let memberCount = 0

      allSkills.forEach((currentSkills) => {
        const memberId = currentSkills.team_member_id
        const previousSnapshot = latestHistory.get(memberId)

        if (previousSnapshot) {
          let categoryCurrent = 0
          let categoryPrevious = 0
          let skillCount = 0

          skillKeys.forEach((skillKey) => {
            const current = (currentSkills[skillKey as keyof typeof currentSkills] as number) || 0
            const previous = (previousSnapshot[skillKey as keyof typeof previousSnapshot] as number) || 0
            if (current !== null && current !== undefined && !isNaN(current) &&
                previous !== null && previous !== undefined && !isNaN(previous)) {
              categoryCurrent += current
              categoryPrevious += previous
              skillCount++
            }
          })

          if (skillCount > 0) {
            const avgCurrent = categoryCurrent / skillCount
            const avgPrevious = categoryPrevious / skillCount
            totalDelta += avgCurrent - avgPrevious
            memberCount++
          }
        }
      })

      skillTrends[category] = memberCount > 0 ? Math.round((totalDelta / memberCount) * 10) / 10 : 0
    })
  }

  // Get feedback skill insights
  const { data: allFeedback } = await supabase
    .from('feedback')
    .select('highlights_skills, improvements_skills')

  const feedbackSkillHighlights: Record<string, number> = {}
  const feedbackSkillImprovements: Record<string, number> = {}

  allFeedback?.forEach(feedback => {
    feedback.highlights_skills?.forEach((skill: string) => {
      feedbackSkillHighlights[skill] = (feedbackSkillHighlights[skill] || 0) + 1
    })
    feedback.improvements_skills?.forEach((skill: string) => {
      feedbackSkillImprovements[skill] = (feedbackSkillImprovements[skill] || 0) + 1
    })
  })

  const feedbackSkillHighlightsArray = Object.entries(feedbackSkillHighlights)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const feedbackSkillImprovementsArray = Object.entries(feedbackSkillImprovements)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    goalsAtRisk,
    avgMotivation,
    influenceDistribution,
    influenceRelationships: influenceMatrix,
    teamSkillAverages,
    goalsByStatus,
    skillTrends,
    feedbackSkillHighlights: feedbackSkillHighlightsArray,
    feedbackSkillImprovements: feedbackSkillImprovementsArray,
    memberMotivations,
    lowMotivationMembers,
  }
}
