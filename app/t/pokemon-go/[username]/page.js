'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'

export default function PublicProfilePage() {
  const params = useParams()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [offers, setOffers] = useState([])
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [editingProfile, setEditingProfile] = useState(false)
  const [goCode, setGoCode] = useState('')
  const [goLevel, setGoLevel] = useState('')
  const [showGoCodePublicly, setShowGoCodePublicly] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  async function loadData() {
    const { data: userData } = await supabaseClient.auth.getUser()
    setUser(userData.user)

    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('username', params.username)
      .maybeSingle()
    setProfile(profileData)

    if (profileData) {
      setGoCode(profileData.go_friend_code || '')
      setGoLevel(profileData.go_level || '')
      setShowGoCodePublicly(profileData.show_go_code_publicly || false)

      const { data: offersData } = await supabaseClient
        .from('trade_offers')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      setOffers(offersData || [])

      const { count } = await supabaseClient
        .from('trade_offers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profileData.id)
        .eq('status', 'completed')
      setCompletedCount(count || 0)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [params.username])

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
      await loadData()
      setEditingProfile(false)
    }
  }

  async function handleSetPassword() {
    setPasswordMsg('')

    if (currentPassword) {
      const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (verifyError) {
        setPasswordMsg('Current password is incorrect.')
        return
      }
    }

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg(error.message)
    } else {
      setPasswordMsg('Password updated successfully!')
      setNewPassword('')
      setCurrentPassword('')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <p className="text-sm text-[#8A8C9C]">Loading...</p>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <p className="text-sm text-[#8A8C9C]">Trainer not found.</p>
      </main>
    )
  }

  const isOwnProfile = user && user.id === profile.id

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/t/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          ← Back
        </Link>
        {isOwnProfile && <PokemonGoNav />}

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h1 className="text-xl font-semibold mb-1">{profile.username}</h1>

          {editingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2">
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

              <div className="pt-3 border-t border-[#2A2C3D] space-y-2">
                <p className="text-xs text-[#8A8C9C]">Set or change your password</p>
                <input
                  type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password (leave blank if none set yet)"
                  className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                />
                <div className="flex gap-2">
                  <input
                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                  />
                  <button type="button" onClick={handleSetPassword} className="text-sm font-medium px-3 py-2 rounded-lg bg-[#2A2C3D] text-[#EDEAE3]">
                    Update
                  </button>
                </div>
                {passwordMsg && <p className="text-xs text-[#4FA8A0]">{passwordMsg}</p>}
              </div>

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
            <>
              <p className="text-sm text-[#C7C9D9]">Trainer level: {profile.go_level || '—'}</p>
              <p className="text-sm text-[#4FA8A0] mt-1">{completedCount} trades completed</p>
              {profile.show_go_code_publicly && profile.go_friend_code && (
                <p className="text-xs text-[#4FA8A0] mt-2 bg-[#14151F] border border-[#2A2C3D] rounded-lg px-3 py-2 inline-block">
                  GO friend code: <span className="font-mono font-semibold">{profile.go_friend_code}</span>
                </p>
              )}
              {isOwnProfile && (
                <button onClick={() => setEditingProfile(true)} className="block text-xs text-[#4FA8A0] hover:text-[#6FC4BC] mt-3">
                  Edit profile
                </button>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h2 className="text-sm font-semibold mb-3">Trade offers</h2>
          {offers.length === 0 && (
            <p className="text-sm text-[#8A8C9C]">No active trade offers.</p>
          )}
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/t/pokemon-go/trades/${offer.id}`}
              className="block text-sm bg-[#14151F] rounded-lg p-3 mb-2 hover:bg-[#2A2C3D] transition-colors"
            >
              <p>Has: <span className="text-[#E8A33D]">{offer.have_pokemon}</span></p>
              <p>Wants: <span className="text-[#4FA8A0]">{offer.want_pokemon}</span></p>
              {offer.notes && <p className="text-xs text-[#8A8C9C] mt-1">{offer.notes}</p>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}