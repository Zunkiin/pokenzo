'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'
import { ArrowLeft } from 'lucide-react'
import TrainerAvatarPicker from '@/components/trainer-avatar-picker'
import PokemonPicker from '@/components/pokemon-picker'

export default function PublicProfilePage() {
  const router = useRouter()
  const params = useParams()
  const [raidsHostedCount, setRaidsHostedCount] = useState(0)
  const [raidsJoinedCount, setRaidsJoinedCount] = useState(0)
  const [raidReputation, setRaidReputation] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [offers, setOffers] = useState([])
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [goCode, setGoCode] = useState('')
  const [goLevel, setGoLevel] = useState('')
  const [goTrainerName, setGoTrainerName] = useState('')
  const [showGoCodePublicly, setShowGoCodePublicly] = useState(false)
  const [avatarTrainerUrl, setAvatarTrainerUrl] = useState('')
  const [avatarPokemonUrl, setAvatarPokemonUrl] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [upgradeEmail, setUpgradeEmail] = useState('')
  const [upgradePassword, setUpgradePassword] = useState('')
  const [upgradeMsg, setUpgradeMsg] = useState('')

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
      setGoTrainerName(profileData.go_trainer_name || '')
      setShowGoCodePublicly(profileData.show_go_code_publicly || false)
      setAvatarTrainerUrl(profileData.avatar_trainer_url || '')
      setAvatarPokemonUrl(profileData.avatar_pokemon_url || '')

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

      const { count: raidsHosted } = await supabaseClient
        .from('raids')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', profileData.id)
        .eq('status', 'closed')
      setRaidsHostedCount(raidsHosted || 0)

      const { count: raidsJoined } = await supabaseClient
        .from('raid_joins')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profileData.id)
        .eq('confirmed', true)
      setRaidsJoinedCount(raidsJoined || 0)

      const { data: feedbackReceived } = await supabaseClient
        .from('raid_feedback')
        .select('went_well')
        .eq('rated_user_id', profileData.id)

      if (feedbackReceived && feedbackReceived.length > 0) {
        const positive = feedbackReceived.filter((f) => f.went_well).length
        setRaidReputation({
          percent: Math.round((positive / feedbackReceived.length) * 100),
          total: feedbackReceived.length,
        })
      } else {
        setRaidReputation(null)
      }
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
        go_trainer_name: goTrainerName || null,
        show_go_code_publicly: showGoCodePublicly,
        avatar_trainer_url: avatarTrainerUrl || null,
        avatar_pokemon_url: avatarPokemonUrl || null,
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

  async function handleUpgradeAccount(e) {
    e.preventDefault()
    setUpgradeMsg('')

    const { error } = await supabaseClient.auth.updateUser({
      email: upgradeEmail,
      password: upgradePassword,
    })

    if (error) {
      setUpgradeMsg(error.message)
    } else {
      await supabaseClient.from('profiles').update({ is_guest: false }).eq('id', user.id)
      setUpgradeMsg('Check your email to confirm the change, then refresh this page.')
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
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back</span>
        </button>

        {isOwnProfile && <PokemonGoNav />}

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <div className="flex items-center gap-3 mb-1">
            {(profile.avatar_trainer_url || profile.avatar_pokemon_url) && (
              <div className="flex items-end -space-x-2">
                {profile.avatar_trainer_url && (
                  <img src={profile.avatar_trainer_url} alt="" className="w-14 h-14 object-contain" />
                )}
                {profile.avatar_pokemon_url && (
                  <img src={profile.avatar_pokemon_url} alt="" className="w-10 h-10 object-contain" />
                )}
              </div>
            )}
            <h1 className="text-xl font-semibold">{profile.username}</h1>
          </div>

          {editingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-[#8A8C9C] mb-1 block">Trainer avatar</label>
                <TrainerAvatarPicker onSelect={setAvatarTrainerUrl} />
              </div>

              <div>
                <label className="text-xs text-[#8A8C9C] mb-1 block">Pokémon avatar (shown on profile)</label>
                <PokemonPicker onSelect={(p) => setAvatarPokemonUrl(p.shiny ? p.shinyImageUrl : p.imageUrl)} placeholder="Search for a Pokémon avatar..." />
              </div>

              {(avatarTrainerUrl || avatarPokemonUrl) && (
                <div className="flex items-end gap-2">
                  {avatarTrainerUrl && <img src={avatarTrainerUrl} alt="" className="w-14 h-14 object-contain" />}
                  {avatarPokemonUrl && <img src={avatarPokemonUrl} alt="" className="w-10 h-10 object-contain" />}
                </div>
              )}

              <input
                value={goTrainerName} onChange={(e) => setGoTrainerName(e.target.value)}
                placeholder="Your in-game trainer name"
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
              />
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

              {profile.is_guest && (
                <div className="pt-3 border-t border-[#2A2C3D] space-y-2">
                  <p className="text-xs text-[#E8A33D] font-semibold">Upgrade to a full account</p>
                  <p className="text-xs text-[#8A8C9C]">Keep your raid history and unlock trading, community chat, and more.</p>
                  <input
                    type="email" required value={upgradeEmail} onChange={(e) => setUpgradeEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                  />
                  <input
                    type="password" required value={upgradePassword} onChange={(e) => setUpgradePassword(e.target.value)}
                    placeholder="Choose a password"
                    className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                  />
                  <button type="button" onClick={handleUpgradeAccount} className="w-full text-sm font-medium px-3 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                    Upgrade account
                  </button>
                  {upgradeMsg && <p className="text-xs text-[#4FA8A0]">{upgradeMsg}</p>}
                </div>
              )}

              {!profile.is_guest && (
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
              )}

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
              <p className="text-sm text-[#C7C9D9] mt-1">{raidsHostedCount} raids hosted · {raidsJoinedCount} raids joined</p>
              {raidReputation && (
                <p className="text-sm text-[#4FA8A0] mt-1">{raidReputation.percent}% positive overall feedback ({raidReputation.total} ratings)</p>
              )}
              {profile.show_go_code_publicly && profile.go_friend_code && (
                <p className="text-xs text-[#4FA8A0] mt-2 bg-[#14151F] border border-[#2A2C3D] rounded-lg px-3 py-2 inline-block">
                  GO friend code: <span className="font-mono font-semibold">{profile.go_friend_code}</span>
                </p>
              )}
              {profile.go_trainer_name && (
                <p className="text-sm text-[#C7C9D9] mt-2">In-game name: {profile.go_trainer_name}</p>
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