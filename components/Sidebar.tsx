'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, ClipboardList, ShieldCheck, FileText,
  Heart, LogOut, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'

interface Profile { role: string; full_name?: string; email: string }

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/services/new', label: 'Log Service', icon: ClipboardList },
  { href: '/dashboard/reports', label: 'Funder Reports', icon: FileText, adminOnly: true },
  { href: '/dashboard/audit', label: 'Audit Log', icon: ShieldCheck, adminOnly: true },
]

export default function Sidebar({ user, profile }: { user: User; profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await getSupabase().auth.signOut()
    router.push('/login')
  }

  const isAdmin = profile?.role === 'admin'

  const NavContent = () => (
    <>
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <span className="font-bold text-lg">CareTrack</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
              {item.adminOnly && (
                <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Admin</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium truncate">{profile?.full_name || user.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{profile?.role ?? 'staff'}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-background border shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        'md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-background border-r flex flex-col transition-transform',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-background flex-shrink-0">
        <NavContent />
      </div>
    </>
  )
}
