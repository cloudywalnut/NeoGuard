export const ALE_CUTOFFS = {
  ac_mm: { threshold: 253, direction: 'below' as const, label: 'Abdominal Circumference' },
  nuchal_thickness_mm: { threshold: 10, direction: 'below' as const, label: 'Nuchal Thickness (10th centile)' },
  // threshold of 10 represents the 10th centile — GA-adjusted centile must be computed from NT reference chart
  ut_ri: { threshold: 0.58, direction: 'above' as const, label: 'Uterine Resistance Index' },
  ut_pi: { threshold: 1.0, direction: 'above' as const, label: 'Uterine Pulsatility Index' },
} as const

export const SHAP_FEATURE_ORDER = [
  'ac_mm', 'nuchal_thickness_mm', 'fl_mm', 'ut_ri', 'ut_pi',
  'bpd_mm', 'ua_pi', 'papp_a_mom',
] as const

export type ALEFeature = keyof typeof ALE_CUTOFFS

export function isFlagged(feature: ALEFeature, value: number): boolean {
  const cutoff = ALE_CUTOFFS[feature]
  return cutoff.direction === 'below' ? value < cutoff.threshold : value > cutoff.threshold
}

// NT percentile table (GA weeks → 10th centile mm) derived from NT reference chart
export const NT_CENTILE_10TH: Record<number, number> = {
  14: 3.2, 15: 3.4, 16: 3.6, 17: 3.8, 18: 4.0,
  19: 4.2, 20: 4.3, 21: 4.4, 22: 4.5, 23: 4.5,
  24: 4.6, 25: 4.6, 26: 4.7, 27: 4.7, 28: 4.7,
}

export function getNT10thCentile(gaWeeks: number): number {
  const clamped = Math.max(14, Math.min(28, Math.round(gaWeeks)))
  return NT_CENTILE_10TH[clamped] ?? 4.5
}

export function isNTFlagged(ntMm: number, gaWeeks: number): boolean {
  return ntMm < getNT10thCentile(gaWeeks)
}

// Disjunctive SGA rule: NT < 10th centile OR EFW < 10th centile
export function isSGARisk(ntMm: number | null, efwPercentile: number | null, gaWeeks: number): boolean {
  const ntFlagged = ntMm != null ? isNTFlagged(ntMm, gaWeeks) : false
  const efwFlagged = efwPercentile != null ? efwPercentile < 10 : false
  return ntFlagged || efwFlagged
}
