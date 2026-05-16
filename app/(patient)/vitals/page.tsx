'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'
import { Card, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils/format'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'

interface Log {
  id: string; logged_at: string; systolic_bp?: number; diastolic_bp?: number
  heart_rate?: number; weight_kg?: number; fetal_movements?: number
  sleep_hours?: number; mood?: string; symptoms?: string[]; notes?: string
}

interface ClinicVital {
  id: string; recorded_at: string; systolic_bp?: number; diastolic_bp?: number
  heart_rate?: number; weight_kg?: number; fundal_height_cm?: number
  urine_protein?: string; oedema?: string; notes?: string
}

const MOOD_EMOJIS: Record<string, string> = { great: '😊', good: '🙂', fair: '😐', poor: '😔' }
const SYMPTOMS_LIST = ['headache', 'swelling', 'nausea', 'back pain', 'spotting', 'reduced kicks']

export default function PatientVitalsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [clinicVitals, setClinicVitals] = useState<ClinicVital[]>([])
  const [form, setForm] = useState({ systolic_bp: '', diastolic_bp: '', heart_rate: '', weight_kg: '', fetal_movements: '', sleep_hours: '', mood: '', symptoms: [] as string[], notes: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/patient/vitals-log').then(r => r.json()).then(d => setLogs(Array.isArray(d) ? d : []))
    fetch('/api/patient/clinic-vitals').then(r => r.json()).then(d => setClinicVitals(Array.isArray(d) ? d : []))
  }, [])

  function toggleSymptom(s: string) {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const toNum = (v: string) => { const n = parseFloat(v); return isNaN(n) ? null : n }
    const body = {
      systolic_bp: toNum(form.systolic_bp),
      diastolic_bp: toNum(form.diastolic_bp),
      heart_rate: toNum(form.heart_rate),
      weight_kg: toNum(form.weight_kg),
      fetal_movements: toNum(form.fetal_movements),
      sleep_hours: toNum(form.sleep_hours),
      mood: form.mood || null,
      symptoms: form.symptoms.length > 0 ? form.symptoms : null,
      notes: form.notes || null,
    }
    const res = await fetch('/api/patient/vitals-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const d = await res.json()
      setLogs(l => [d, ...l])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setForm({ systolic_bp: '', diastolic_bp: '', heart_rate: '', weight_kg: '', fetal_movements: '', sleep_hours: '', mood: '', symptoms: [], notes: '' })
    }
    setSaving(false)
  }

  const sorted = [...logs].sort((a, b) => a.logged_at.localeCompare(b.logged_at))
  const bpData = sorted.filter(l => l.systolic_bp).map(l => ({ date: format(parseISO(l.logged_at), 'dd/MM'), sys: l.systolic_bp, dia: l.diastolic_bp }))
  const weightData = sorted.filter(l => l.weight_kg).map(l => ({ date: format(parseISO(l.logged_at), 'dd/MM'), w: l.weight_kg }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">My Vitals</h1>
        <p className="text-purple-400 font-medium mt-1">Track your health day by day</p>
      </div>

      {/* Log form */}
      <Card>
        <CardTitle>Log Today's Readings</CardTitle>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <FormField label="Systolic BP"><Input type="number" value={form.systolic_bp} onChange={e => setForm(f => ({ ...f, systolic_bp: e.target.value }))} placeholder="120" /></FormField>
            <FormField label="Diastolic BP"><Input type="number" value={form.diastolic_bp} onChange={e => setForm(f => ({ ...f, diastolic_bp: e.target.value }))} placeholder="80" /></FormField>
            <FormField label="Heart Rate (bpm)"><Input type="number" value={form.heart_rate} onChange={e => setForm(f => ({ ...f, heart_rate: e.target.value }))} placeholder="72" /></FormField>
            <FormField label="Weight (kg)"><Input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="65.5" /></FormField>
            <FormField label="Kick count (24h)"><Input type="number" value={form.fetal_movements} onChange={e => setForm(f => ({ ...f, fetal_movements: e.target.value }))} placeholder="10" /></FormField>
            <FormField label="Sleep hours"><Input type="number" step="0.5" value={form.sleep_hours} onChange={e => setForm(f => ({ ...f, sleep_hours: e.target.value }))} placeholder="7.5" /></FormField>
          </div>

          {/* Mood */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">How are you feeling?</p>
            <div className="flex gap-2">
              {(['great', 'good', 'fair', 'poor'] as const).map(m => (
                <button key={m} type="button" onClick={() => setForm(f => ({ ...f, mood: m }))}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${form.mood === m ? 'border-pink-400 bg-pink-50' : 'border-purple-100 hover:border-purple-200'}`}>
                  <span className="text-2xl">{MOOD_EMOJIS[m]}</span>
                  <span className="text-xs font-semibold text-purple-600 mt-1 capitalize">{m}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Any symptoms?</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS_LIST.map(s => (
                <button key={s} type="button" onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${form.symptoms.includes(s) ? 'bg-pink-500 text-white border-pink-500' : 'border-purple-200 text-purple-500 hover:border-pink-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" loading={saving} className="w-full">
            {saved ? '✅ Saved!' : 'Save Reading'}
          </Button>
        </form>
      </Card>

      {/* Charts */}
      {bpData.length >= 2 && (
        <Card>
          <CardTitle>Blood Pressure Over Time</CardTitle>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bpData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <YAxis domain={[60, 180]} tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }} />
              <ReferenceLine y={140} stroke="#FCA5A5" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="sys" stroke="#F9A8D4" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
              <Line type="monotone" dataKey="dia" stroke="#C4B5FD" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-red-400 mt-1">Dashed line = 140 mmHg (seek care if BP reaches or exceeds this)</p>
        </Card>
      )}

      {weightData.length >= 2 && (
        <Card>
          <CardTitle>Weight Trend</CardTitle>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={weightData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A78BFA' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E9D5FF', fontSize: 12 }} />
              <Line type="monotone" dataKey="w" stroke="#C4B5FD" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Clinic-recorded vitals */}
      {clinicVitals.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="font-bold text-lg text-purple-800">From Your Clinic</h2>
            <p className="text-xs text-purple-400">Readings recorded by your doctor during visits</p>
          </div>
          {clinicVitals.slice(0, 5).map(v => (
            <Card key={v.id} className="border-violet-100">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <p className="text-xs text-purple-400">{formatDateTime(v.recorded_at)}</p>
                  <div className="flex gap-4 flex-wrap">
                    {v.systolic_bp && (
                      <span className={`text-sm font-semibold ${v.systolic_bp >= 140 ? 'text-red-600' : 'text-purple-700'}`}>
                        BP: {v.systolic_bp}/{v.diastolic_bp}
                        {v.systolic_bp >= 140 && <span className="ml-1 text-xs text-red-500">⚠ high</span>}
                      </span>
                    )}
                    {v.heart_rate && <span className="text-sm font-semibold text-purple-700">HR: {v.heart_rate} bpm</span>}
                    {v.weight_kg && <span className="text-sm font-semibold text-purple-700">Wt: {v.weight_kg} kg</span>}
                    {v.fundal_height_cm && <span className="text-sm font-semibold text-purple-700">FH: {v.fundal_height_cm} cm</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {v.urine_protein && v.urine_protein !== 'negative' && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">Protein: {v.urine_protein}</span>
                    )}
                    {v.oedema && v.oedema !== 'none' && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">Oedema: {v.oedema}</span>
                    )}
                  </div>
                  {v.notes && <p className="text-xs text-purple-500 italic">{v.notes}</p>}
                </div>
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center ml-3 shrink-0">
                  <span className="text-sm">🏥</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent entries */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg text-purple-800">Recent Entries</h2>
        {logs.length === 0 ? (
          <p className="text-purple-400 text-sm">No readings logged yet. Log your first reading above!</p>
        ) : logs.slice(0, 10).map(log => (
          <Card key={log.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-purple-400">{formatDateTime(log.logged_at)}</p>
                <div className="flex gap-4 mt-1 flex-wrap">
                  {log.systolic_bp && <span className="text-sm font-semibold text-purple-700">BP: {log.systolic_bp}/{log.diastolic_bp}</span>}
                  {log.weight_kg && <span className="text-sm font-semibold text-purple-700">Wt: {log.weight_kg}kg</span>}
                  {log.fetal_movements && <span className="text-sm font-semibold text-purple-700">Kicks: {log.fetal_movements}</span>}
                  {log.sleep_hours && <span className="text-sm font-semibold text-purple-700">Sleep: {log.sleep_hours}h</span>}
                </div>
                {log.symptoms && log.symptoms.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {log.symptoms.map(s => <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs">{s}</span>)}
                  </div>
                )}
              </div>
              {log.mood && <span className="text-2xl">{MOOD_EMOJIS[log.mood]}</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
