'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Calendar, ScanLine, Bot, Settings,
  Home, Activity, Baby, MessageCircle, ChevronLeft, ChevronRight,
  Menu, X, HeartPulse, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'

interface NavItem { href: string; label: string; icon: React.ElementType }

const doctorNav: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/patients',     label: 'My Patients',  icon: Users           },
  { href: '/appointments', label: 'Appointments', icon: Calendar        },
  { href: '/scans',        label: 'All Scans',    icon: ScanLine        },
  { href: '/ai',           label: 'AI Agent',     icon: Bot             },
  { href: '/settings',     label: 'Settings',     icon: Settings        },
]

const patientNav: NavItem[] = [
  { href: '/home',       label: 'Home',         icon: Home          },
  { href: '/vitals',     label: 'My Vitals',    icon: Activity      },
  { href: '/my-scans',   label: 'My Scans',     icon: ScanLine      },
  { href: '/pregnancy',  label: 'My Pregnancy', icon: Baby          },
  { href: '/chat',       label: 'Chat 💜',      icon: MessageCircle },
]

interface SideDrawerProps {
  role: 'doctor' | 'patient'
  userName?: string
}

export function SideDrawer({ role, userName }: SideDrawerProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)

  const nav    = role === 'doctor' ? doctorNav : patientNav
  const theme  = role === 'doctor' ? 'from-pink-50 to-rose-50'     : 'from-violet-50 to-purple-50'
  const accent = role === 'doctor' ? 'text-pink-600 bg-pink-100'   : 'text-violet-600 bg-violet-100'

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const drawerContent = (
    <div className={cn('flex flex-col h-full bg-linear-to-b border-r border-purple-100', theme)}>

      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-purple-100', collapsed && 'justify-center')}>
        <div className="w-9 h-9 rounded-xl bg-pink-500 flex items-center justify-center shrink-0">
          <HeartPulse size={20} className="text-white" />
        </div>
        {!collapsed && <span className="font-extrabold text-xl text-purple-900 tracking-tight">NeoGuard</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                active ? accent : 'text-purple-600 hover:bg-white/60 hover:text-purple-800',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="font-semibold text-sm">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="p-3 border-t border-purple-100 space-y-1">
        {userName && !collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-0.5">Signed in as</p>
            <p className="text-sm font-semibold text-purple-800 truncate">{userName}</p>
          </div>
        )}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
            'text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-sm">
              {signingOut ? 'Signing out…' : 'Sign out'}
            </span>
          )}
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="hidden lg:flex items-center justify-center p-3 border-t border-purple-100 text-purple-400 hover:text-purple-600 hover:bg-white/50 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md text-purple-600 border border-purple-100"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-64 h-full">{drawerContent}</div>
          <div className="flex-1 bg-purple-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={cn('hidden lg:flex flex-col h-full transition-all duration-300', collapsed ? 'w-16' : 'w-60')}>
        {drawerContent}
      </div>
    </>
  )
}
