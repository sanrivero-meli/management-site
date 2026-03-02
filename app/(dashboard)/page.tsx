import { getDashboardMetrics } from '@/app/actions/dashboard'
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hi, Santi!</h1>
          <p className="mt-2 mr-2 text-sm text-muted-foreground">
            Overview of team health, project management, and team performance
          </p>
        </div>
        <DashboardActions />
      </div>

      <DashboardMetrics metrics={metrics} />
    </div>
  )
}
