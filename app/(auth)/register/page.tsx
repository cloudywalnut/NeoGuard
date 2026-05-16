'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HeartPulse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    hospital: '', specialization: '', department: '', license_number: '',
  })

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    const res = await fetch('/api/auth/register-doctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        hospital: form.hospital,
        specialization: form.specialization,
        department: form.department,
        license_number: form.license_number,
      }),
    })

    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Registration failed'); return }

    // Auto sign-in after registration
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-500 shadow-lg mb-4">
            <HeartPulse size={32} className="text-white" />
          </div>
          <h1 className="font-extrabold text-3xl text-purple-950 tracking-tight">NeoGuard</h1>
          <p className="text-purple-400 font-medium mt-1">Doctor Registration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-8">
          <h2 className="font-bold text-xl text-purple-900 mb-6">Create doctor account</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormField label="Full name" required>
                  <Input value={form.full_name} onChange={set('full_name')} placeholder="Dr. Jane Smith" required />
                </FormField>
              </div>
              <div className="col-span-2">
                <FormField label="Email" required>
                  <Input type="email" value={form.email} onChange={set('email')} placeholder="you@hospital.com" required />
                </FormField>
              </div>
              <FormField label="Password" required>
                <Input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required />
              </FormField>
              <FormField label="Confirm password" required>
                <Input type="password" value={form.confirm_password} onChange={set('confirm_password')} placeholder="Repeat password" required />
              </FormField>
              <div className="col-span-2 border-t border-purple-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Professional Details</p>
              </div>
              <div className="col-span-2">
                <FormField label="Hospital / Institution">
                  <Input value={form.hospital} onChange={set('hospital')} placeholder="University Malaya Medical Centre" />
                </FormField>
              </div>
              <FormField label="Specialization">
                <Input value={form.specialization} onChange={set('specialization')} placeholder="Obstetrics & Gynaecology" />
              </FormField>
              <FormField label="Department">
                <Input value={form.department} onChange={set('department')} placeholder="O&G" />
              </FormField>
              <div className="col-span-2">
                <FormField label="License number">
                  <Input value={form.license_number} onChange={set('license_number')} placeholder="MMC-12345" />
                </FormField>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-purple-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-pink-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
