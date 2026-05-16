import { isSGARisk, isNTFlagged } from '../constants/ale-cutoffs'
import type { Scan } from '../../types/database'

export function computeALEFlags(scan: Partial<Scan>, gaWeeks: number) {
  return {
    ac_flagged: scan.ac_mm != null ? scan.ac_mm < 253 : false,
    nt_flagged: scan.nuchal_thickness_mm != null ? isNTFlagged(scan.nuchal_thickness_mm, gaWeeks) : false,
    ut_ri_flagged: scan.ut_ri != null ? scan.ut_ri > 0.58 : false,
    ut_pi_flagged: scan.ut_pi != null ? scan.ut_pi > 1.0 : false,
  }
}

export function computeSGARisk(scan: Partial<Scan>, gaWeeks: number): 'low' | 'moderate' | 'high' {
  const flags = computeALEFlags(scan, gaWeeks)
  const sgaRule = isSGARisk(scan.nuchal_thickness_mm ?? null, scan.efw_percentile ?? null, gaWeeks)
  const flagCount = Object.values(flags).filter(Boolean).length
  if (sgaRule || flagCount >= 2) return 'high'
  if (flagCount === 1) return 'moderate'
  return 'low'
}

export function riskScoreToLabel(score: number): 'low' | 'moderate' | 'high' {
  if (score >= 0.6) return 'high'
  if (score >= 0.35) return 'moderate'
  return 'low'
}
