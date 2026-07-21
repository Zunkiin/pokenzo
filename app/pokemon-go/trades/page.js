'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'
import PokemonPicker from '@/components/pokemon-picker'
import { ArrowLeft } from 'lucide-react'

export default function TradesPage() {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allOffers, setAllOffers] = useState([])
  const [myOffers, setMyOffers] = useState([])

  const [haveData, setHaveData] = useState(null)
  const [wantData, setWantData] = useState(null)
  const [notesInput, setNotesInput] = useState('')
  const [offerError, setOfferError] = useState('')

  async function loadAllOffers() {
    const { data } = await supabaseClient
      .from('trade_offers')
      .select('id, have_pokemon, have_image_url, have_shiny, want_pokemon, want_image_url, want_shiny, notes, user_id, profiles(username)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setAllOffers(data || [])
  }

  async function loadMyOffers(userId) {
    const { data } = await supabaseClient
      .from('trade_offers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setMyOffers(data || [])
  }

  useEffect(() => {
    supabaseClient.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        await loadMyOffers(data.user.id)
        const { data: profileData } = await supabaseClient.from('profiles').select('is_guest').eq('id', data.user.id).maybeSingle()
        setIsGuest(profileData?.is_guest || false)
      }
      await loadAllOffers()
      setLoading(false)
    })
  }, [])

  async function handleAddOffer(e) {
    e.preventDefault()
    setOfferError('')

    if (!haveData || !wantData) {
      setOfferError('Please select a Pokémon for both "I have" and "I want".')
      return
    }

    const { data: existingOffer } = await supabaseClient
      .from('trade_offers')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingOffer) {
      setOfferError('You already have an active trade offer. Delete it before posting a new one.')
      return
    }

    const { error } = await supabaseClient
      .from('trade_offers')
      .insert({
        user_id: user.id,
        have_pokemon: haveData.name,
        have_image_url: haveData.shiny ? haveData.shinyImageUrl : haveData.imageUrl,
        have_shiny: haveData.shiny,
        want_pokemon: wantData.name,
        want_image_url: wantData.shiny ? wantData.shinyImageUrl : wantData.imageUrl,
        want_shiny: wantData.shiny,
        notes: notesInput || null,
      })

    if (error) {
      setOfferError(error.message)
    } else {
      setHaveData(null)
      setWantData(null)
      setNotesInput('')
      await loadAllOffers()
      await loadMyOffers(user.id)
    }
  }

  async function handleDeleteOffer(id) {
    await supabaseClient.from('trade_offers').delete().eq('id', id)
    await loadAllOffers()
    await loadMyOffers(user.id)
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
        <Link href="/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back</span>
        </Link>

        <h1 className="text-xl font-semibold">Trade Offers</h1>
        <PokemonGoNav />

        {user && isGuest && (
          <div className="rounded-xl border border-[#E8A33D] bg-[#E8A33D]/10 p-4">
            <p className="text-sm text-[#EDEAE3] mb-1">Trading isn't available for guest accounts.</p>
            <Link href="/pokemon-go" className="text-xs text-[#E8A33D] hover:underline">
              Create a full account to unlock this →
            </Link>
          </div>
        )}

        {user && !isGuest && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <h2 className="text-sm font-semibold mb-3">Add a trade offer</h2>
            <form onSubmit={handleAddOffer} className="space-y-3">
              <div>
                <label className="text-xs text-[#8A8C9C] mb-1 block">I have</label>
                <PokemonPicker onSelect={setHaveData} placeholder="Search for the Pokémon you have..." />
              </div>
              <div>
                <label className="text-xs text-[#8A8C9C] mb-1 block">I want</label>
                <PokemonPicker onSelect={setWantData} placeholder="Search for the Pokémon you want..." />
              </div>
              <input value={notesInput} onChange={(e) => setNotesInput(e.target.value)} placeholder="Notes (optional)"
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
              {offerError && <p className="text-xs text-[#C1554A]">{offerError}</p>}
              <button type="submit" className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
                Post trade offer
              </button>
            </form>

            {myOffers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#2A2C3D] space-y-2">
                <p className="text-xs text-[#8A8C9C] mb-2">Your active offers</p>
                {myOffers.map((offer) => (
                  <div key={offer.id} className="relative text-sm bg-[#14151F] rounded-lg p-3">
                    <Link
                      href={`/pokemon-go/trades/${offer.id}`}
                      className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-lg bg-[#2A2C3D] text-[#4FA8A0] hover:bg-[#3A3D57] transition-colors"
                    >
                      See chats
                    </Link>
                    <div className="pr-20">
                      <p>Have: <span className="text-[#E8A33D]">{offer.have_pokemon}</span>{offer.have_shiny && ' ✨ Shiny'}</p>
                      <p>Want: <span className="text-[#4FA8A0]">{offer.want_pokemon}</span>{offer.want_shiny && ' ✨ Shiny'}</p>
                      {offer.notes && <p className="text-xs text-[#8A8C9C] mt-1">{offer.notes}</p>}
                    </div>
                    <div className="flex justify-end mt-2">
                      <button onClick={() => handleDeleteOffer(offer.id)} className="text-xs text-[#C1554A] hover:text-[#E8836F]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#8A8C9C]">All trade offers</h2>
          {allOffers.length === 0 && (
            <p className="text-sm text-[#8A8C9C]">No trade offers yet. Be the first to post one!</p>
          )}
          {allOffers.map((offer) => (
            <Link
              key={offer.id}
              href={`/pokemon-go/trades/${offer.id}`}
              className="block rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors"
            >
              <p className="text-xs text-[#8A8C9C] mb-2">{offer.profiles?.username}</p>
              <p className="text-sm">Has: <span className="text-[#E8A33D] font-medium">{offer.have_pokemon}</span>{offer.have_shiny && ' ✨ Shiny'}</p>
              <p className="text-sm">Wants: <span className="text-[#4FA8A0] font-medium">{offer.want_pokemon}</span>{offer.want_shiny && ' ✨ Shiny'}</p>
              {offer.notes && <p className="text-xs text-[#8A8C9C] mt-2">{offer.notes}</p>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}