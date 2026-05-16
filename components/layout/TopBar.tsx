import { LogOut, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TopBarProps {
  title?: string
  subtitle?: string
  contextPill?: string
}

export function TopBar({ title, subtitle, contextPill }: TopBarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-purple-100 shrink-0">
      <div>
        {title && <h1 className="font-extrabold text-2xl text-purple-950 tracking-tight">{title}</h1>}
        {subtitle && <p className="text-sm text-purple-400 font-medium">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {contextPill && (
          <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">
            {contextPill}
          </span>
        )}
        <button className="p-2 rounded-xl hover:bg-purple-50 text-purple-400 hover:text-purple-600 transition-colors">
          <Bell size={18} />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors text-sm font-semibold"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
