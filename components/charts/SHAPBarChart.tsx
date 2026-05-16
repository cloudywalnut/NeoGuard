'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'

const FEATURE_LABELS: Record<string, string> = {
  ac_mm: 'AC', nuchal_thickness_mm: 'NT', fl_mm: 'FL',
  ut_ri: 'Ut RI', ut_pi: 'Ut PI', bpd_mm: 'BPD',
  ua_pi: 'UA PI', papp_a_mom: 'PAPP-A',
}

interface Props { shapValues: Record<string, number> }

export function SHAPBarChart({ shapValues }: Props) {
  const data = Object.entries(shapValues)
    .map(([key, value]) => ({ name: FEATURE_LABELS[key] ?? key, value: +value.toFixed(3) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 6)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
        <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11, fill: '#A78BFA' }} />
        <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 11, fill: '#6B21A8' }} />
        <Tooltip
          formatter={(v) => [typeof v === 'number' ? v.toFixed(3) : v, 'SHAP']}
          contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }}
        />
        <ReferenceLine x={0} stroke="#C4B5FD" />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.value > 0 ? '#F9A8D4' : '#C4B5FD'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
