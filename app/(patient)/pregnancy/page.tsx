import { createClient } from '@/lib/supabase/server'
import { calculateGestationalAge, formatGA } from '@/lib/utils/gestational-age'
import { getBabySize } from '@/lib/utils/baby-size'
import { Card, CardTitle } from '@/components/ui/card'

const WEEK_MILESTONES: Record<number, { baby: string; mum: string }> = {
  4: { baby: 'A tiny ball of cells is implanting in the uterus.', mum: 'You may notice early signs of pregnancy.' },
  8: { baby: 'All major organs have begun to form.', mum: 'Morning sickness may peak this week.' },
  12: { baby: 'Baby is fully formed — nails and hair are growing!', mum: 'Risk of miscarriage drops significantly.' },
  16: { baby: 'Baby can make facial expressions and suck their thumb.', mum: 'You might feel baby move for the first time!' },
  20: { baby: 'Halfway there! Baby is about 25cm long.', mum: 'Anatomy scan usually happens this week.' },
  24: { baby: 'Baby\'s lungs are developing and they can hear sounds.', mum: 'Some swelling in feet and ankles is normal.' },
  28: { baby: 'Baby can open their eyes and blink.', mum: 'Third trimester begins — more frequent checkups.' },
  32: { baby: 'Baby is practicing breathing movements.', mum: 'Baby might be in a head-down position by now.' },
  36: { baby: 'Baby is nearly ready — gaining weight rapidly.', mum: 'Weekly checkups begin.' },
  40: { baby: 'Full term! Baby is ready to meet you.', mum: 'Labor could begin any day now.' },
}

function getClosestMilestone(week: number) {
  const keys = Object.keys(WEEK_MILESTONES).map(Number).sort((a, b) => a - b)
  let best = keys[0]
  for (const k of keys) { if (week >= k) best = k }
  return WEEK_MILESTONES[best]
}

const TIPS = [
  { icon: '💧', title: 'Hydration', text: 'Aim for 8-10 glasses of water daily. Staying hydrated helps prevent swelling and supports baby\'s development.' },
  { icon: '🥗', title: 'Nutrition', text: 'Include iron-rich foods (spinach, lentils), calcium (dairy, leafy greens), and folate (legumes, fortified grains) daily.' },
  { icon: '🚶', title: 'Movement', text: 'Gentle walking 20–30 minutes a day can improve circulation, reduce back pain, and boost your mood.' },
  { icon: '😴', title: 'Sleep', text: 'Sleep on your left side when possible — it improves circulation to baby. Use pillows for support.' },
]

export default async function PregnancyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: patient } = await supabase.from('ng_patients').select('lmp, edd').eq('id', user!.id).single()

  if (!patient) return <div className="p-6 text-purple-400">Patient profile not found.</div>

  const ga = calculateGestationalAge(patient.lmp)
  const babySize = getBabySize(ga.weeks)
  const milestone = getClosestMilestone(ga.weeks)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">My Pregnancy</h1>
        <p className="text-purple-400 font-medium mt-1">Week {ga.weeks} of 40</p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-pink-100 p-5">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Progress</span>
          <span className="font-bold text-pink-600">{formatGA(ga.weeks, ga.days)}</span>
        </div>
        <div className="h-5 bg-purple-100 rounded-full overflow-hidden">
          <div
            className="h-5 rounded-full bg-gradient-to-r from-pink-400 to-violet-500 flex items-center justify-end pr-2"
            style={{ width: `${Math.min((ga.weeks / 40) * 100, 100)}%` }}
          >
            <span className="text-xs text-white">{babySize.emoji}</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-purple-300 mt-2">
          <span>🌱 T1 (wk 1–13)</span>
          <span>🌿 T2 (wk 14–27)</span>
          <span>🌸 T3 (wk 28–40)</span>
        </div>
      </div>

      {/* This week */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-pink-400">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Your Baby This Week</p>
          <p className="text-3xl mb-2">{babySize.emoji}</p>
          <p className="font-bold text-purple-800">About the size of a {babySize.name}</p>
          <p className="text-sm text-purple-600 mt-2">{milestone.baby}</p>
        </Card>
        <Card className="border-l-4 border-l-violet-400">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">What You Might Feel</p>
          <p className="text-3xl mb-2">🤰</p>
          <p className="text-sm text-purple-600 mt-2">{milestone.mum}</p>
        </Card>
      </div>

      {/* Trimester breakdown */}
      <Card>
        <CardTitle>Trimester Journey</CardTitle>
        <div className="mt-4 space-y-3">
          {[
            { name: 'First Trimester', weeks: '1–13 weeks', emoji: '🌱', active: ga.weeks < 14, done: ga.weeks >= 14, desc: 'Baby\'s major organs form. Morning sickness, fatigue, and mood changes are common.' },
            { name: 'Second Trimester', weeks: '14–27 weeks', emoji: '🌿', active: ga.weeks >= 14 && ga.weeks < 28, done: ga.weeks >= 28, desc: 'Energy returns! Baby movements begin. Anatomy scan and SGA monitoring happen here.' },
            { name: 'Third Trimester', weeks: '28–40 weeks', emoji: '🌸', active: ga.weeks >= 28, done: false, desc: 'Baby grows rapidly. Prepare for labor and delivery. More frequent monitoring.' },
          ].map(t => (
            <div key={t.name} className={`p-4 rounded-xl border-2 ${t.active ? 'border-pink-300 bg-pink-50' : t.done ? 'border-green-200 bg-green-50' : 'border-purple-100 bg-white'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <div>
                  <p className="font-bold text-purple-800">{t.name}</p>
                  <p className="text-xs text-purple-400">{t.weeks}</p>
                </div>
                {t.done && <span className="ml-auto text-green-500 font-bold text-sm">✅ Complete</span>}
                {t.active && <span className="ml-auto text-pink-500 font-bold text-sm">← You are here</span>}
              </div>
              <p className="text-sm text-purple-600 mt-2">{t.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly tips */}
      <Card>
        <CardTitle>Weekly Wellness Tips</CardTitle>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {TIPS.map(tip => (
            <div key={tip.title} className="p-3 bg-violet-50 rounded-xl">
              <p className="text-2xl mb-1">{tip.icon}</p>
              <p className="font-bold text-purple-800 text-sm">{tip.title}</p>
              <p className="text-xs text-purple-600 mt-1">{tip.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
