import { cn } from '@/lib/utils/format'
import type { HTMLAttributes } from 'react'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-white rounded-2xl shadow-sm border border-pink-100 p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-bold text-lg text-purple-900 mb-1', className)} {...props}>
      {children}
    </h3>
  )
}

export function StatCard({
  label, value, sub, color = 'rose',
}: { label: string; value: string | number; sub?: string; color?: 'rose' | 'violet' | 'green' | 'amber' | 'red' }) {
  const bg: Record<string, string> = {
    rose: 'from-pink-50 to-rose-50 border-pink-200',
    violet: 'from-violet-50 to-purple-50 border-violet-200',
    green: 'from-green-50 to-emerald-50 border-green-200',
    amber: 'from-amber-50 to-yellow-50 border-amber-200',
    red: 'from-red-50 to-rose-50 border-red-200',
  }
  const text: Record<string, string> = {
    rose: 'text-pink-600', violet: 'text-violet-600',
    green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600',
  }
  return (
    <div className={cn('rounded-2xl border p-5 bg-gradient-to-br', bg[color])}>
      <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-1">{label}</p>
      <p className={cn('font-extrabold text-3xl', text[color])}>{value}</p>
      {sub && <p className="text-sm text-purple-400 mt-1">{sub}</p>}
    </div>
  )
}
