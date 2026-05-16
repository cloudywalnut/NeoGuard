'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import type { Scan } from '@/types/database'
import { Card, CardTitle } from '@/components/ui/card'

interface Props { scans: Scan[] }

export function BiometryTrendChart({ scans }: Props) {
  if (scans.length < 2) return null

  const data = scans.map(s => ({
    ga: `${s.gestational_age_weeks}w`,
    AC: s.ac_mm,
    EFW_pct: s.efw_percentile,
    NT: s.nuchal_thickness_mm,
    UtPI: s.ut_pi,
    UtRI: s.ut_ri,
    Risk: s.sga_risk_score != null ? +(s.sga_risk_score * 100).toFixed(1) : null,
  }))

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardTitle>AC Trend (mm)</CardTitle>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <XAxis dataKey="ga" tick={{ fontSize: 11, fill: '#A78BFA' }} />
            <YAxis tick={{ fontSize: 11, fill: '#A78BFA' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }} />
            <ReferenceLine y={253} stroke="#FCA5A5" strokeDasharray="4 4" label={{ value: '253mm', fill: '#DC2626', fontSize: 10 }} />
            <Line type="monotone" dataKey="AC" stroke="#F9A8D4" strokeWidth={2} dot={{ r: 4 }} name="AC (mm)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <CardTitle>EFW Percentile</CardTitle>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <XAxis dataKey="ga" tick={{ fontSize: 11, fill: '#A78BFA' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#A78BFA' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }} />
            <ReferenceLine y={10} stroke="#FCA5A5" strokeDasharray="4 4" label={{ value: '10th', fill: '#DC2626', fontSize: 10 }} />
            <Line type="monotone" dataKey="EFW_pct" stroke="#C4B5FD" strokeWidth={2} dot={{ r: 4 }} name="EFW %ile" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <CardTitle>SGA Risk Score (%)</CardTitle>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <XAxis dataKey="ga" tick={{ fontSize: 11, fill: '#A78BFA' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#A78BFA' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }} />
            <ReferenceLine y={60} stroke="#FCA5A5" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="Risk" stroke="#EC4899" strokeWidth={2} dot={{ r: 4 }} name="Risk %" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      {data.some(d => d.UtPI != null) && (
        <Card>
          <CardTitle>Doppler (Ut PI / RI)</CardTitle>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data}>
              <XAxis dataKey="ga" tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }} />
              <ReferenceLine y={1.0} stroke="#FCA5A5" strokeDasharray="4 4" label={{ value: 'PI 1.0', fill: '#DC2626', fontSize: 10 }} />
              <ReferenceLine y={0.58} stroke="#FDE68A" strokeDasharray="4 4" label={{ value: 'RI 0.58', fill: '#D97706', fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="UtPI" stroke="#F9A8D4" strokeWidth={2} dot={{ r: 3 }} name="Ut PI" />
              <Line type="monotone" dataKey="UtRI" stroke="#C4B5FD" strokeWidth={2} dot={{ r: 3 }} name="Ut RI" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
