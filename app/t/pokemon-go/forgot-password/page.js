'use client'
import { useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/t/pokemon-go/reset-password',
    })
    if (error) setErrorMsg(error.message)
    else setSent(true)
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-4">
        <Link href="/t/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          ← Back to login
        </Link>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h1 className="text-lg font-semibold mb-3">Reset your password</h1>
          {sent ? (
            <p className="text-sm text-[#C7C9D9]">Check your email for a password reset link.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
              />
              {errorMsg && <p className="text-xs text-[#C1554A]">{errorMsg}</p>}
              <button type="submit" className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                Send reset link
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}