import { cn } from '@/lib/utils/format'
import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'low' | 'moderate' | 'high' | 'purple' | 'pink' | 'outline'

const styles: Record<BadgeVariant, string> = {
  default: 'bg-purple-100 text-purple-700',
  low: 'bg-green-100 text-green-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  purple: 'bg-violet-100 text-violet-700',
  pink: 'bg-pink-100 text-pink-700',
  outline: 'border border-purple-200 text-purple-600',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide',
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function RiskBadge({ label }: { label: string | null }) {
  const v = (label as BadgeVariant) ?? 'default'
  const labels: Record<string, string> = { low: 'Low', moderate: 'Moderate', high: 'High' }
  return <Badge variant={v}>{labels[label ?? ''] ?? label ?? '—'}</Badge>
}
