'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTeamMember } from '@/app/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewTeamMemberPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await createTeamMember(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push(`/team/${result.data.id}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/team">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Team
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Team Member</CardTitle>
          <CardDescription>Enter the team member's basic information</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  disabled={isLoading}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isLoading}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seniority">Seniority *</Label>
                <Input
                  id="seniority"
                  name="seniority"
                  required
                  disabled={isLoading}
                  placeholder="Senior"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select name="level" defaultValue="2" required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1</SelectItem>
                    <SelectItem value="2">Level 2</SelectItem>
                    <SelectItem value="3">Level 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="influence_level">Influence Level *</Label>
                <Select
                  name="influence_level"
                  defaultValue="3"
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level} - {getInfluenceLabel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivation_level">Motivation Level *</Label>
                <Select
                  name="motivation_level"
                  defaultValue="3"
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level} - {getMotivationLabel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-md bg-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Link href="/team">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4" />
                {isLoading ? 'Creating...' : 'Create Team Member'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function getInfluenceLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Low',
    2: 'Below Average',
    3: 'Average',
    4: 'High',
    5: 'Very High',
  }
  return labels[level] || 'Unknown'
}

function getMotivationLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Moderate',
    4: 'High',
    5: 'Very High',
  }
  return labels[level] || 'Unknown'
}
