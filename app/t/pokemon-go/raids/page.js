'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'
import { getPokemonList } from '@/lib/pokeapi'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function RaidsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [raids, setRaids] = useState([])
  const [loading, setLoading] = useState(true)

  const [maxJoiners, setMaxJoiners] = useState(10)
  const [createError, setCreateError] = useState('')
  const [pokemonList, setPokemonList] = useState([])
  const [bossSearch, setBossSearch] = useState('')
  const [selectedBoss, setSelectedBoss] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [profile, setProfile] = useState(null)
  const [needsTrainerName, setNeedsTrainerName] = useState(false)
  const [trainerNameInput, setTrainerNameInput] = useState('')

  async function loadRaids() {
    const { data: raidRows } = await supabaseClient
      .from('raids')
      .select('id, boss, boss_image_url, max_joiners, status, host_id, profiles(username)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    const withCounts = await Promise.all(
  (raidRows || []).map(async (raid) => {
    const { data: countData } = await supabaseClient.rpc('count_raid_joins', { target_raid_id: raid.id })
    return { ...raid, joinCount: countData || 0 }
  })
)
    setRaids(withCounts)
  }

  useEffect(() => {
  supabaseClient.auth.getUser().then(async ({ data }) => {
    setUser(data.user)
    if (data.user) {
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('go_trainer_name')
        .eq('id', data.user.id)
        .maybeSingle()
      setProfile(profileData)
      setNeedsTrainerName(!profileData?.go_trainer_name)
    }
    await loadRaids()
    setLoading(false)
  })
  getPokemonList().then(setPokemonList)

  const channel = supabaseClient
    .channel('raids_list')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'raids' }, () => {
      loadRaids()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'raid_joins' }, () => {
      loadRaids()
    })
    .subscribe()

  return () => { supabaseClient.removeChannel(channel) }
}, [])

async function handleSaveTrainerName(e) {
  e.preventDefault()
  if (!trainerNameInput.trim()) return

  const { error } = await supabaseClient
    .from('profiles')
    .update({ go_trainer_name: trainerNameInput.trim() })
    .eq('id', user.id)

  if (!error) {
    setNeedsTrainerName(false)
  }
}

  async function handleCreateRaid(e) {
  e.preventDefault()
  setCreateError('')

  if (!selectedBoss) {
    setCreateError('Please select a Pokémon from the list.')
    return
  }

  

  const { data: existingRaid } = await supabaseClient
    .from('raids')
    .select('id')
    .eq('host_id', user.id)
    .eq('status', 'open')
    .maybeSingle()

  if (existingRaid) {
    setCreateError('You already have an active raid. End it before hosting a new one.')
    return
  }

  const { data, error } = await supabaseClient
    .from('raids')
    .insert({
      host_id: user.id,
      boss: selectedBoss.displayName,
      boss_image_url: selectedBoss.imageUrl,
      max_joiners: maxJoiners,
    })
    .select()
    .single()

  if (error) {
    setCreateError(error.message)
  } else {
    router.push(`/t/pokemon-go/raids/${data.id}`)
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
        <Link href="/t/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
         <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back</span>
        </Link>

        <h1 className="text-xl font-semibold">Raids</h1>
        <PokemonGoNav />

        {user && needsTrainerName && (
        <div className="rounded-xl border border-[#E8A33D] bg-[#E8A33D]/10 p-4">
          <h2 className="text-sm font-semibold mb-2">Set your trainer name first</h2>
          <p className="text-xs text-[#C7C9D9] mb-3">Other players need to know your in-game name to add you as a friend.</p>
          <form onSubmit={handleSaveTrainerName} className="space-y-3">
            <input
              required value={trainerNameInput} onChange={(e) => setTrainerNameInput(e.target.value)}
              placeholder="Your in-game trainer name"
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
            />
            <button type="submit" className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
              Save and continue
            </button>
          </form>
        </div>
        )}

        {user && !needsTrainerName && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <h2 className="text-sm font-semibold mb-3">Host a raid</h2>
            <form onSubmit={handleCreateRaid} className="space-y-3">
              <div className="relative">
                <input
                  value={bossSearch}
                  onChange={(e) => { setBossSearch(e.target.value); setSelectedBoss(null); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search for a Pokémon..."
                  className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                />
                {selectedBoss && (
                  <div className="flex items-center gap-2 mt-2 bg-[#14151F] border border-[#2A2C3D] rounded-lg p-2">
                    <img src={selectedBoss.imageUrl} alt={selectedBoss.displayName} className="w-10 h-10 object-contain" />
                    <span className="text-sm">{selectedBoss.displayName}</span>
                  </div>
                )}
                {showDropdown && bossSearch && !selectedBoss && (
                  <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#2A2C3D] bg-[#1E2030] shadow-lg">
                    {pokemonList
                        .filter((p) => {
                            const normalizedName = p.name.replace(/-/g, '')
                            const searchTerms = bossSearch.toLowerCase().split(/\s+/).filter(Boolean)
                            return searchTerms.every((term) => normalizedName.includes(term.replace(/-/g, '')))
                          })
                            .slice(0, 8)
                            .map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => { setSelectedBoss(p); setBossSearch(p.displayName); setShowDropdown(false) }}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[#2A2C3D] text-sm"
                        >
                          <img src={p.imageUrl} alt={p.displayName} className="w-6 h-6 object-contain" />
                          {p.displayName}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-[#8A8C9C] mb-1 block">Max number of people who can join (up to 10)</label>
                <input
                  type="number" min="1" max="10" value={maxJoiners}
                  onChange={(e) => setMaxJoiners(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                />
              </div>
              {createError && <p className="text-xs text-[#C1554A]">{createError}</p>}
              <button type="submit" className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                Host raid
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#8A8C9C]">Open raids</h2>
          {raids.length === 0 && (
            <p className="text-sm text-[#8A8C9C]">No open raids right now. Host one!</p>
          )}
          {raids.map((raid) => (
            <Link
              key={raid.id}
              href={`/t/pokemon-go/raids/${raid.id}`}
              className="block rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors"
            >
              <div className="flex items-center gap-3">
                {raid.boss_image_url && (
                  <img src={raid.boss_image_url} alt={raid.boss} className="w-12 h-12 object-contain flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs text-[#8A8C9C] mb-1">Hosted by {raid.profiles?.username}</p>
                  <p className="text-lg font-semibold text-[#E8A33D]">{raid.boss}</p>
                  <p className="text-xs text-[#C7C9D9] mt-1">{raid.joinCount} / {raid.max_joiners} joined</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}