'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogPortal,
} from '@/components/ui/dialog'
import {
  LogOut,
  Home,
  Users,
  CheckSquare,
  Calendar,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Planning', href: '/planning', icon: Calendar },
  { name: 'Todos', href: '/todos', icon: CheckSquare },
]

function NavLinks({
  pathname,
  onNavigate,
  className,
  mobile = false,
}: {
  pathname: string | null
  onNavigate?: () => void
  className?: string
  mobile?: boolean
}) {
  return (
    <div
      className={cn(
        'flex gap-1',
        mobile ? 'w-full flex-col items-stretch gap-0' : 'items-center',
        className
      )}
    >
      {navigation.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname?.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
              mobile ? 'py-3' : 'py-2',
              isActive
                ? 'bg-[rgba(67,76,228,0.15)] text-primary'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.name}
          </Link>
        )
      })}
    </div>
  )
}

function getUserInitial(user: User | null): string {
  if (!user) return '?'
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name
  if (name && typeof name === 'string') {
    return name.charAt(0).toUpperCase()
  }
  const email = user.email
  if (email) return email.charAt(0).toUpperCase()
  return '?'
}

function getUserDisplay(user: User | null): string | null {
  if (!user) return null
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name
  if (name && typeof name === 'string') return name
  return user.email ?? null
}

export function Navbar({ user = null }: { user?: User | null }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const userInitial = getUserInitial(user ?? null)
  const userDisplay = getUserDisplay(user ?? null)

  return (
    <nav aria-label="Main navigation" className="border-b border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Desktop nav - hidden on small screens */}
            <div className="hidden md:block">
              <NavLinks pathname={pathname} />
            </div>
            {/* Hamburger - visible only on small screens */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center">
            <form action={signOut}>
              <Button variant="ghost" size="icon-sm" type="submit" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile menu - slide-out drawer */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogPortal>
          <DialogContent
            showCloseButton={false}
            className="fixed left-0 top-0 flex h-full w-[min(280px,85vw)] max-w-full translate-x-0 translate-y-0 flex-col rounded-none border-0 border-r border-border bg-secondary p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 sm:max-w-[280px]"
          >
            <DialogTitle className="sr-only">Navigation menu</DialogTitle>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
              <NavLinks
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
                mobile
              />
              <div className="mt-auto border-t border-border pt-4">
                <div
                  className="flex items-center gap-3"
                  aria-label="Signed in user"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-foreground">
                    {userInitial}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {userDisplay ?? 'Signed in'}
                  </span>
                  <form action={signOut}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="submit"
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </nav>
  )
}
