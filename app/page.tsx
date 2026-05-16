import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HeartPulse, Brain, Activity, Shield, ChevronRight, Sparkles } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('ng_profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'doctor') redirect('/dashboard')
    if (profile?.role === 'patient') redirect('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-100 overflow-x-hidden">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-pink-500 flex items-center justify-center shadow-md shrink-0">
            <HeartPulse size={20} className="text-white" />
          </div>
          <span className="font-extrabold text-xl sm:text-2xl text-purple-950 tracking-tight">NeoGuard</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-purple-600 hover:text-purple-900 transition-colors px-3 py-2 rounded-xl hover:bg-white/70 whitespace-nowrap"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold px-3 sm:px-5 py-2.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors shadow-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">Create account</span>
            <span className="sm:hidden">Register</span>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold mb-7 shadow-sm">
          <Sparkles size={13} />
          AI-Powered Maternal &amp; Fetal Care
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-purple-950 tracking-tight leading-[1.1] mb-6">
          Protecting every{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
            little heartbeat
          </span>
        </h1>

        <p className="text-lg text-purple-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          NeoGuard uses explainable AI to help clinicians detect Small-for-Gestational-Age risk earlier —
          so every baby gets the care they deserve, from the very first scan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-pink-500 text-white font-bold rounded-2xl shadow-lg hover:bg-pink-600 active:scale-[0.98] transition-all text-base"
          >
            Sign in to NeoGuard
            <ChevronRight size={18} />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-purple-200 text-purple-800 font-bold rounded-2xl hover:border-pink-300 hover:shadow-md transition-all text-base"
          >
            Register as a doctor
          </Link>
        </div>
      </section>

      {/* ── Feature cards ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-7 border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center mb-5">
            <Brain size={22} className="text-pink-600" />
          </div>
          <h3 className="font-bold text-purple-900 text-base mb-2">Explainable AI</h3>
          <p className="text-sm text-purple-400 leading-relaxed">
            SHAP-powered risk scores show exactly which scan features drive SGA predictions —
            no black boxes, just transparent clinical insight.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-7 border border-violet-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center mb-5">
            <Activity size={22} className="text-violet-600" />
          </div>
          <h3 className="font-bold text-purple-900 text-base mb-2">Real-time Monitoring</h3>
          <p className="text-sm text-purple-400 leading-relaxed">
            Track fetal biometry, Doppler indices, and maternal vitals across every visit
            in a single, unified timeline.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-7 border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center mb-5">
            <Shield size={22} className="text-pink-600" />
          </div>
          <h3 className="font-bold text-purple-900 text-base mb-2">Patient-centred Care</h3>
          <p className="text-sm text-purple-400 leading-relaxed">
            Patients receive plain-language scan summaries and can log their own vitals —
            keeping families informed and engaged throughout pregnancy.
          </p>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-pink-500 to-violet-600 p-10 text-center text-white shadow-xl">
          <HeartPulse size={36} className="mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-extrabold mb-3">Ready to get started?</h2>
          <p className="text-pink-100 mb-7 text-sm max-w-sm mx-auto">
            Doctors can register and begin managing their patients immediately.
            Patients are onboarded by their assigned clinician.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 bg-white text-pink-600 font-bold rounded-xl hover:bg-pink-50 transition-colors shadow-sm"
            >
              Register as a doctor
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="text-center pb-10 text-xs text-purple-300 px-4">
        Research basis: Saw SN et al., Prenatal Diagnosis 2025 · University Malaya Medical Centre cohort (n = 5,519)
      </footer>
    </div>
  )
}
