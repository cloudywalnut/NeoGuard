'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import type { Vital } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { Card, CardTitle } from '@/components/ui/card'

interface Props { vitals: Vital[] }

export function VitalsChart({ vitals }: Props) {
  if (vitals.length < 2) return null

  const sorted = [...vitals].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
  const bpData = sorted.filter(v => v.systolic_bp != null).map(v => ({
    date: format(parseISO(v.recorded_at), 'dd/MM'),
    systolic: v.systolic_bp,
    diastolic: v.diastolic_bp,
  }))

  const weightData = sorted.filter(v => v.weight_kg != null).map(v => ({
    date: format(parseISO(v.recorded_at), 'dd/MM'),
    weight: v.weight_kg,
  }))

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {bpData.length >= 2 && (
        <Card>
          <CardTitle>Blood Pressure Trend</CardTitle>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={bpData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <YAxis domain={[60, 180]} tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }} />
              <ReferenceLine y={140} stroke="#FCA5A5" strokeDasharray="4 4" label={{ value: '140', fill: '#DC2626', fontSize: 10 }} />
              <ReferenceLine y={90} stroke="#FDE68A" strokeDasharray="4 4" label={{ value: '90', fill: '#D97706', fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="systolic" stroke="#F9A8D4" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
              <Line type="monotone" dataKey="diastolic" stroke="#C4B5FD" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
      {weightData.length >= 2 && (
        <Card>
          <CardTitle>Weight Trend</CardTitle>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" stroke="#F9A8D4" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
