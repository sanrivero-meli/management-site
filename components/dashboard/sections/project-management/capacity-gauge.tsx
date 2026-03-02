'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Users, AlertTriangle } from 'lucide-react'

interface CapacityGaugeProps {
  capacityUtilization: number
  overallocatedMembers: Array<{ name: string; allocated: number; capacity: number }>
}

export function CapacityGauge({ capacityUtilization, overallocatedMembers }: CapacityGaugeProps) {
  function getCapacityColor(utilization: number) {
    return 'bg-blue-600'
  }

  function getCapacityTextColor(utilization: number) {
    return 'text-foreground'
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Capacity Utilization
        </h3>
        <p className="text-sm text-muted-foreground mt-1">% of sprints allocated this quarter</p>
      </div>
      <div className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-2 ${getCapacityTextColor(capacityUtilization)}`}>
            {capacityUtilization}%
          </div>
          <div className="h-3 w-full rounded-full bg-secondary">
            <div
              className={`h-3 rounded-full transition-all ${getCapacityColor(capacityUtilization)}`}
              style={{ width: `${Math.min(capacityUtilization, 100)}%` }}
            />
          </div>
        </div>

        {overallocatedMembers.length > 0 && (
          <div className="pt-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-600">
                {overallocatedMembers.length} Overallocated Member{overallocatedMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {[...overallocatedMembers]
                .sort((a, b) => b.allocated - a.allocated)
                .map((member, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{member.name}</span>
                  <Badge variant="negative">
                    {member.allocated}/{member.capacity} sprints
                  </Badge>
                </div>
              ))}
            </div>
            <Link href="/planning" className="text-sm text-primary hover:underline font-medium block mt-3">
              Review planning →
            </Link>
          </div>
        )}

        {overallocatedMembers.length === 0 && capacityUtilization > 0 && (
          <div className="pt-2">
            <Link href="/planning" className="text-sm text-blue-600 hover:underline font-medium">
              View planning details →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
