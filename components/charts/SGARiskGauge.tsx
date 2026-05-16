'use client'

interface Props { score: number; label: string | null }

export function SGARiskGauge({ score, label }: Props) {
  const pct = Math.round(score * 100)
  const color = label === 'high' ? '#FCA5A5' : label === 'moderate' ? '#FDE68A' : '#86EFAC'
  const strokeColor = label === 'high' ? '#DC2626' : label === 'moderate' ? '#D97706' : '#16A34A'

  const r = 60
  const cx = 80
  const cy = 80
  const circumference = Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center py-4">
      <svg width={160} height={100} viewBox="0 0 160 100">
        {/* Background arc */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none" stroke="#E9D5FF" strokeWidth={12} strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none" stroke={strokeColor} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" className="text-3xl font-black" fill={strokeColor} fontSize={28} fontWeight={900}>
          {pct}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#A78BFA" fontSize={12} fontWeight={600}>
          SGA Risk Score
        </text>
      </svg>
      <div className={`mt-2 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest`} style={{ background: color, color: strokeColor }}>
        {label ?? 'Unknown'}
      </div>
    </div>
  )
}
