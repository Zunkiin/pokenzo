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
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestUsername, setGuestUsername] = useState('')
  const [guestGoCode, setGuestGoCode] = useState('')
  const [isGuest, setIsGuest] = useState(false)

  async function loadProfile(userId) {
    const { data: existing } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (existing) {
      setProfile(existing)
      setIsGuest(existing.is_guest || false)
      return
    }

    const urlParams = new URLSearchParams(window.location.search)
    const pendingUsername = urlParams.get('pending_username') || localStorage.getItem(PENDING_USERNAME_KEY)

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
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/pokemon-go?pending_username=' + encodeURIComponent(username)
        }
      })
      if (error) { setErrorMsg(error.message); return }
      setSent(true)
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
      if (error) setErrorMsg(error.message)
    }
  }

  async function handleGuestSignIn(e) {
    e.preventDefault()
    setErrorMsg('')

    if (!guestUsername.trim()) {
      setErrorMsg('Please choose a username.')
      return
    }

    const cleanedCode = guestGoCode.replace(/\s/g, '')
    if (!/^\d{12}$/.test(cleanedCode)) {
      setErrorMsg('Please enter a valid 12-digit Pokémon GO friend code.')
      return
    }

    const { data, error } = await supabaseClient.auth.signInAnonymously()

    if (error) {
      setErrorMsg(error.message)
      return
    }

    const { error: profileError } = await supabaseClient.from('profiles').insert({
      id: data.user.id,
      username: guestUsername.trim(),
      go_trainer_name: guestUsername.trim(),
      go_friend_code: cleanedCode,
      is_guest: true,
    })

    if (profileError) {
      await supabaseClient.auth.signOut()
      setErrorMsg(profileError.message.includes('duplicate') ? 'That username is already taken. Please choose a different one.' : profileError.message)
      return
    }

    await loadProfile(data.user.id)
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

        <div>
          <h1 className="text-xl font-semibold">Pokémon GO Hub</h1>
          <p className="text-sm text-[#8A8C9C] mt-1">Coordinate raids, trade Pokémon, and connect with trainers across the World.</p>
        </div>
        <PokemonGoNav />

        {user && profile && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(profile.avatar_trainer_url || profile.avatar_pokemon_url) && (
                  <div className="flex items-end -space-x-2">
                    {profile.avatar_trainer_url && (
                      <img src={profile.avatar_trainer_url} alt="" className="w-12 h-12 object-contain" />
                    )}
                    {profile.avatar_pokemon_url && (
                      <img src={profile.avatar_pokemon_url} alt="" className="w-9 h-9 object-contain" />
                    )}
                  </div>
                )}
                <div>
                  <p className="font-medium">{profile.username}</p>
                  <p className="text-xs text-[#8A8C9C]">
                    GO code: {profile.go_friend_code || '—'} · Level {profile.go_level || '—'}
                  </p>
                  <Link href={`/pokemon-go/${profile.username}`} className="text-xs text-[#4FA8A0] hover:text-[#6FC4BC] block mt-1">
                    View my public profile →
                  </Link>
                  {isGuest && (
                    <Link href={`/pokemon-go/${profile.username}`} className="text-xs font-semibold text-[#E8A33D] hover:underline block mt-1">
                      Upgrade to a full account →
                    </Link>
                  )}
                </div>
              </div>
              <button onClick={handleLogout} className="text-xs text-[#C1554A] hover:text-[#E8836F]">
                Log out
              </button>
            </div>
          </div>
        )}

        <a href="https://pokemongolive.com/news/" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors">
          <p className="text-xs uppercase tracking-[0.15em] text-[#E8A33D] font-semibold mb-1">Latest news</p>
          <p className="text-sm text-[#EDEAE3]">Check the official Pokémon GO news and events →</p>
        </a>

        <a href="https://pokemongo.com/en/events" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors">
          <p className="text-xs uppercase tracking-[0.15em] text-[#4FA8A0] font-semibold mb-1">Current & upcoming events</p>
          <p className="text-sm text-[#EDEAE3]">See what's happening in Pokémon GO right now →</p>
        </a>

        <a href="https://pokemongo.com/en/gofest" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors">
          <p className="text-xs uppercase tracking-[0.15em] text-[#E8A33D] font-semibold mb-1">GO Fest</p>
          <p className="text-sm text-[#EDEAE3]">Check out this year's Pokémon GO Fest →</p>
        </a>

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
                  <Link href="/pokemon-go/forgot-password" className="block text-center text-xs text-[#8A8C9C] hover:text-[#E8A33D]">
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