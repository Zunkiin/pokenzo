'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'

export default function TradesPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allOffers, setAllOffers] = useState([])
  const [myOffers, setMyOffers] = useState([])

  const [haveInput, setHaveInput] = useState('')
  const [wantInput, setWantInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [offerError, setOfferError] = useState('')

  async function loadAllOffers() {
  const { data } = await supabaseClient
    .from('trade_offers')
    .select('id, have_pokemon, want_pokemon, notes, user_id, profiles(username)')
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
      await loadAllOffers()
      if (data.user) await loadMyOffers(data.user.id)
      setLoading(false)
    })
  }, [])

  async function handleAddOffer(e) {
    e.preventDefault()
    setOfferError('')
    const { error } = await supabaseClient
      .from('trade_offers')
      .insert({ user_id: user.id, have_pokemon: haveInput, want_pokemon: wantInput, notes: notesInput || null })
    if (error) {
      setOfferError(error.message)
    } else {
      setHaveInput('')
      setWantInput('')
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
        <Link href="/t/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          ← Back
        </Link>

        <h1 className="text-xl font-semibold">Trade Offers</h1>
        <PokemonGoNav />

        {user && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <h2 className="text-sm font-semibold mb-3">Add a trade offer</h2>
            <form onSubmit={handleAddOffer} className="space-y-3">
              <input required value={haveInput} onChange={(e) => setHaveInput(e.target.value)} placeholder="I have..."
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
              <input required value={wantInput} onChange={(e) => setWantInput(e.target.value)} placeholder="I want..."
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
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
                <div key={offer.id} className="flex items-start justify-between text-sm bg-[#14151F] rounded-lg p-3">
                 <div>
                 <p>Have: <span className="text-[#E8A33D]">{offer.have_pokemon}</span></p>
                <p>Want: <span className="text-[#4FA8A0]">{offer.want_pokemon}</span></p>
                  {offer.notes && <p className="text-xs text-[#8A8C9C] mt-1">{offer.notes}</p>}
                
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
             <Link href={`/t/pokemon-go/trades/${offer.id}`} className="text-xs text-[#4FA8A0] hover:text-[#6FC4BC]">
                 See chats
            </Link>
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
              href={`/t/pokemon-go/trades/${offer.id}`}
              className="block rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors"
            >
              <p className="text-xs text-[#8A8C9C] mb-2">{offer.profiles?.username}</p>
              <p className="text-sm">Has: <span className="text-[#E8A33D] font-medium">{offer.have_pokemon}</span></p>
              <p className="text-sm">Wants: <span className="text-[#4FA8A0] font-medium">{offer.want_pokemon}</span></p>
              {offer.notes && <p className="text-xs text-[#8A8C9C] mt-2">{offer.notes}</p>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}