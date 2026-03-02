'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export function DashboardActions() {
  const router = useRouter()

  return (
    <div className="flex gap-2">
      <Link href="/team/new">
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Add Team Member
        </Button>
      </Link>
      <Button onClick={() => router.push('/projects/new')}>
        <Plus className="h-4 w-4" />
        Create Project
      </Button>
    </div>
  )
}
