import { notFound } from 'next/navigation'
import { getTeamMember } from '@/app/actions/team'
import { getGoals } from '@/app/actions/goals'
import { getFeedback } from '@/app/actions/feedback'
import { getSkills } from '@/app/actions/skills'
import { getPerformanceProjects } from '@/app/actions/performance-projects'
import { getProjects } from '@/app/actions/projects'
import { getInfluenceForMember, getOtherTeamMembers } from '@/app/actions/influence'
import { TeamMemberDetail } from '@/components/team/team-member-detail'

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  try {
    const [member, goals, feedback, skills, performanceProjects, projects, influenceRelationships, otherMembers] = await Promise.all([
      getTeamMember(id),
      getGoals(id).catch(() => []),
      getFeedback(id).catch(() => []),
      getSkills(id).catch(() => null),
      getPerformanceProjects(id).catch(() => []),
      getProjects().catch(() => []),
      getInfluenceForMember(id).catch(() => []),
      getOtherTeamMembers(id).catch(() => []),
    ])
    return (
      <TeamMemberDetail 
        member={member} 
        goals={goals} 
        feedback={feedback} 
        skills={skills}
        performanceProjects={performanceProjects}
        projects={projects}
        influenceRelationships={influenceRelationships}
        otherMembers={otherMembers}
      />
    )
  } catch (error) {
    notFound()
  }
}
