import Link from 'next/link'
import { getTeamMembers } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'
import { TeamRoster } from '@/components/team/team-roster'

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>
}) {
  const params = await searchParams
  const teamMembers = await getTeamMembers()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage team members and their performance data
          </p>
        </div>
        <Link href="/team/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Team Member
          </Button>
        </Link>
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No team members yet</p>
            <Link href="/team/new" className="mt-4">
              <Button variant="outline">Add your first team member</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <TeamRoster teamMembers={teamMembers} />
      )}
    </div>
  )
}
