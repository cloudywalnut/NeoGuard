'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HeartPulse, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    // Sign out any existing session before signing in, so a previous user's
    // session never carries over when credentials for a different account are submitted.
    await supabase.auth.signOut()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('ng_profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'doctor') router.push('/dashboard')
      else router.push('/home')
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-500 shadow-lg mb-4">
            <HeartPulse size={32} className="text-white" />
          </div>
          <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">NeoGuard</h1>
          <p className="text-purple-400 font-medium mt-1">AI Maternal & Fetal Care Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
          <h2 className="font-bold text-xl text-purple-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <FormField label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-purple-400 mt-6">
            Are you a doctor?{' '}
            <Link href="/register" className="text-pink-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-purple-300 mt-6">
          Research basis: Saw SN et al., Prenatal Diagnosis 2025
        </p>
      </div>
    </div>
  )
}
