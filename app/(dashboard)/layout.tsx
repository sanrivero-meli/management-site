import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar user={user} />
      <main id="main-content" className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-8">
        {children}
      </main>
      {/* Global live region for screen reader announcements */}
      <div
        id="live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  )
}
