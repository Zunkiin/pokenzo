'use client'
import { useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    const { error } = await supabaseClient.auth.updateUser({ password })
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/pokemon-go'), 2000)
    }
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto">
        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h1 className="text-lg font-semibold mb-3">Set a new password</h1>
          {success ? (
            <p className="text-sm text-[#4FA8A0]">Password updated! Redirecting you to log in...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
              />
              {errorMsg && <p className="text-xs text-[#C1554A]">{errorMsg}</p>}
              <button type="submit" className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                Update password
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}