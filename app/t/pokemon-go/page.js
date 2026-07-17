'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'

const PENDING_USERNAME_KEY = 'pokenzo_pending_username'

export default function PokemonGoTestPage() {
  const [mode, setMode] = useState('magic')
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadOrCreateProfile(userId) {
    const { data: existing } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (existing) {
      setProfile(existing)
      return
    }

    const pendingUsername = typeof window !== 'undefined' ? localStorage.getItem(PENDING_USERNAME_KEY) : null

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
      if (data.user) await loadOrCreateProfile(data.user.id)
      setLoading(false)
    })

    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadOrCreateProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleMagicLink(e) {
    e.preventDefault()
    setErrorMsg('')

    if (isSignUp) {
      localStorage.setItem(PENDING_USERNAME_KEY, username)
    }

    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/t/pokemon-go' }
    })
    if (error) setErrorMsg(error.message)
    else setSent(true)
  }

  async function handlePasswordAuth(e) {
    e.preventDefault()
    setErrorMsg('')

    if (isSignUp) {
      const { data, error } = await supabaseClient.auth.signUp({ email, password })
      if (error) {
        setErrorMsg(error.message)
        return
      }
      if (data.user) {
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({ id: data.user.id, username })
        if (profileError) {
          setErrorMsg(profileError.message.includes('duplicate') ? 'That username is already taken.' : profileError.message)
          return
        }
      }
      setSent(true)
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) setErrorMsg(error.message)
    }
  }

  async function handleLogout() {
    await supabaseClient.auth.signOut()
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
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold mb-6">Pokémon GO Hub (test)</h1>

        {user && profile && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <p className="text-sm text-[#8A8C9C] mb-1">Logged in as</p>
            <p className="font-medium mb-4">{profile.username}</p>
            <button onClick={handleLogout} className="text-sm font-medium px-4 py-2 rounded-lg bg-[#2A2C3D] text-[#EDEAE3] hover:bg-[#3A3D57]">
              Log out
            </button>
          </div>
        )}

        {user && !profile && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <p className="text-sm text-[#C1554A]">
              Logged in, but no profile found. This can happen if you logged in without signing up first. Please contact support.
            </p>
          </div>
        )}

        {!user && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setMode('magic'); setSent(false); setErrorMsg('') }}
                className={'flex-1 text-sm font-medium px-3 py-2 rounded-lg ' + (mode === 'magic' ? 'bg-[#E8A33D] text-[#14151F]' : 'bg-[#14151F] text-[#8A8C9C] border border-[#2A2C3D]')}>
                Magic Link
              </button>
              <button onClick={() => { setMode('password'); setSent(false); setErrorMsg('') }}
                className={'flex-1 text-sm font-medium px-3 py-2 rounded-lg ' + (mode === 'password' ? 'bg-[#E8A33D] text-[#14151F]' : 'bg-[#14151F] text-[#8A8C9C] border border-[#2A2C3D]')}>
                Password
              </button>
            </div>

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
              <p className="text-sm text-[#C7C9D9]">
                {mode === 'magic' ? 'Check your email for a login link.' : 'Check your email to confirm your account, then log in.'}
              </p>
            ) : (
              <form onSubmit={mode === 'magic' ? handleMagicLink : handlePasswordAuth} className="space-y-3">
                {isSignUp && (
                  <input
                    required value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                  />
                )}
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                />
                {mode === 'password' && (
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                  />
                )}
                {errorMsg && <p className="text-xs text-[#C1554A]">{errorMsg}</p>}
                <button type="submit" className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                  {mode === 'magic' ? 'Send login link' : (isSignUp ? 'Sign up' : 'Log in')}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  )
}