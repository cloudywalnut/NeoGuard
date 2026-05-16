import { format, parseISO } from 'date-fns'

export function formatDate(dateStr: string): string {
  try { return format(parseISO(dateStr), 'dd MMM yyyy') } catch { return dateStr }
}

export function formatDateTime(dateStr: string): string {
  try { return format(parseISO(dateStr), 'dd MMM yyyy, h:mm a') } catch { return dateStr }
}

export function formatTime(dateStr: string): string {
  try { return format(parseISO(dateStr), 'h:mm a') } catch { return dateStr }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function riskColor(label: string | null): string {
  if (label === 'high') return 'bg-red-100 text-red-700 border-red-200'
  if (label === 'moderate') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

export function riskDot(label: string | null): string {
  if (label === 'high') return 'bg-red-400'
  if (label === 'moderate') return 'bg-amber-400'
  return 'bg-green-400'
}
