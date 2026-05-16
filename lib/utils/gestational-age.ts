import { differenceInDays, addDays, format } from 'date-fns'

export function calculateGestationalAge(lmp: string): { weeks: number; days: number; total_days: number } {
  const lmpDate = new Date(lmp)
  const today = new Date()
  const totalDays = differenceInDays(today, lmpDate)
  return {
    weeks: Math.floor(totalDays / 7),
    days: totalDays % 7,
    total_days: totalDays,
  }
}

export function calculateEDD(lmp: string): string {
  return format(addDays(new Date(lmp), 280), 'yyyy-MM-dd')
}

export function formatGA(weeks: number, days: number): string {
  return `${weeks}w ${days}d`
}

export function getTrimester(weeks: number): 1 | 2 | 3 {
  if (weeks < 14) return 1
  if (weeks < 28) return 2
  return 3
}

export function daysUntilEDD(edd: string): number {
  return Math.max(0, differenceInDays(new Date(edd), new Date()))
}
