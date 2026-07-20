'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'
import { ArrowLeft } from 'lucide-react'

const PENDING_USERNAME_KEY = 'pokenzo_pending_username'

export default function PokemonGoTestPage() {
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [editingProfile, setEditingProfile] = useState(false)
  const [goCode, setGoCode] = useState('')
  const [goLevel, setGoLevel] = useState('')
  const [showGoCodePublicly, setShowGoCodePublicly] = useState(false)

  async function loadProfile(userId) {
    const { data: existing } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (existing) {
      setProfile(existing)
      setGoCode(existing.go_friend_code || '')
      setGoLevel(existing.go_level || '')
      setShowGoCodePublicly(existing.show_go_code_publicly || false)
      return
    }

    const pendingUsername = localStorage.getItem(PENDING_USERNAME_KEY)
    if (pendingUsername) {
      const { data: created, error } = await supabaseClient
        .from('profiles')
        .insert({ id: userId, username: pendingUsername })
        .select()
        .single()

      localStorage.removeItem(PENDING_USERNAME_KEY)
      if (!error) {
        setProfile(created)
        return
      }
    }

    setProfile(null)
  }

  useEffect(() => {
    supabaseClient.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        await loadProfile(data.user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handlePasswordAuth(e) {
    e.preventDefault()
    setErrorMsg('')
    if (isSignUp) {
      localStorage.setItem(PENDING_USERNAME_KEY, username)
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + '/t/pokemon-go' }
      })
      if (error) { setErrorMsg(error.message); return }
      setSent(true)
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) setErrorMsg(error.message)
    }
  }

  async function handleLogout() {
    await supabaseClient.auth.signOut()
  }

  async function handleCompleteProfile(e) {
    e.preventDefault()
    setErrorMsg('')
    const { error } = await supabaseClient.from('profiles').insert({ id: user.id, username })
    if (error) {
      setErrorMsg(error.message.includes('duplicate') ? 'That username is already taken.' : error.message)
    } else {
      await loadProfile(user.id)
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    const { error } = await supabaseClient
      .from('profiles')
      .update({
        go_friend_code: goCode || null,
        go_level: goLevel ? parseInt(goLevel) : null,
        show_go_code_publicly: showGoCodePublicly,
      })
      .eq('id', user.id)
    if (!error) {
      await loadProfile(user.id)
      setEditingProfile(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <p className="text-sm text-[#8A8C9C]">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
        <ArrowLeft size={16} strokeWidth={2.5} /> Back to TCG
      </Link>
        <h1 className="text-xl font-semibold">Pokémon GO Hub (test)</h1>
        <PokemonGoNav />

        {user && profile && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{profile.username}</p>
                <Link href={`/t/pokemon-go/${profile.username}`} className="text-xs text-[#4FA8A0] hover:text-[#6FC4BC] block mt-1">
                  View my public profile →
                </Link>
                <Link href="/t/pokemon-go/trades" className="text-xs text-[#4FA8A0] hover:text-[#6FC4BC] block mt-1">
                  
                </Link>
                <Link href="/t/pokemon-go/chats" className="text-xs text-[#4FA8A0] hover:text-[#6FC4BC] block mt-1">
                  
                </Link>
              </div>
              <button onClick={handleLogout} className="text-xs text-[#C1554A] hover:text-[#E8836F]">
                Log out
              </button>
            </div>

            {editingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3 pt-3 border-t border-[#2A2C3D]">
                <input
                  value={goCode} onChange={(e) => setGoCode(e.target.value)}
                  placeholder="Pokémon GO friend code"
                  className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                />
                <input
                  type="number" value={goLevel} onChange={(e) => setGoLevel(e.target.value)}
                  placeholder="Trainer level"
                  className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                />
                <label className="flex items-center gap-2 text-sm text-[#C7C9D9]">
                  <input
                    type="checkbox" checked={showGoCodePublicly} onChange={(e) => setShowGoCodePublicly(e.target.checked)}
                    className="accent-[#E8A33D]"
                  />
                  Show my GO code on my public profile
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingProfile(false)} className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-[#2A2C3D] text-[#EDEAE3]">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-3 border-t border-[#2A2C3D] text-sm">
                <p className="text-[#C7C9D9]">GO code: {profile.go_friend_code || '—'}</p>
                <p className="text-[#C7C9D9] mb-3">Trainer level: {profile.go_level || '—'}</p>
                <button onClick={() => setEditingProfile(true)} className="text-xs text-[#4FA8A0] hover:text-[#6FC4BC]">
                  
                </button>
              </div>
            )}
          </div>
        )}

        {user && !profile && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <h2 className="text-sm font-semibold mb-1">Complete your profile</h2>
            <p className="text-xs text-[#8A8C9C] mb-4">
              We couldn't confirm the username you chose earlier (this can happen if you clicked the confirmation link on a different device or browser). Please choose one now to finish setting up your account.
            </p>
            <form onSubmit={handleCompleteProfile} className="space-y-3">
              <input
                required value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
              />
              {errorMsg && <p className="text-xs text-[#C1554A]">{errorMsg}</p>}
              <button type="submit" className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                Save profile
              </button>
            </form>
          </div>
        )}

        {!user && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <div className="flex gap-2 mb-4 text-xs">
              <button onClick={() => { setIsSignUp(true); setSent(false); setErrorMsg('') }}
                className={isSignUp ? 'text-[#E8A33D] font-semibold' : 'text-[#8A8C9C]'}>
                Sign up
              </button>
              <span className="text-[#4A4D67]">·</span>
              <button onClick={() => { setIsSignUp(false); setSent(false); setErrorMsg('') }}
                className={!isSignUp ? 'text-[#E8A33D] font-semibold' : 'text-[#8A8C9C]'}>
                Log in
              </button>
            </div>

            {sent ? (
              <p className="text-sm text-[#C7C9D9]">Check your email to confirm your account, then log in.</p>
            ) : (
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                {isSignUp && (
                  <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username"
                    className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
                )}
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                  className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
                {errorMsg && <p className="text-xs text-[#C1554A]">{errorMsg}</p>}
                <button type="submit" className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                  {isSignUp ? 'Sign up' : 'Log in'}
                </button>
                {!isSignUp && (
                  <Link href="/t/pokemon-go/forgot-password" className="block text-center text-xs text-[#8A8C9C] hover:text-[#E8A33D]">
                    Forgot password?
                  </Link>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  )
}