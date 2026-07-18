'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function TradeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [offer, setOffer] = useState(null)
  const [user, setUser] = useState(null)
  const [existingChatId, setExistingChatId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseClient.auth.getUser()
      setUser(userData.user)

      const { data: offerData } = await supabaseClient
        .from('trade_offers')
        .select('id, have_pokemon, want_pokemon, notes, user_id, profiles(username, go_level)')
        .eq('id', params.id)
        .maybeSingle()
      setOffer(offerData)

      if (userData.user && offerData) {
        const { data: chat } = await supabaseClient
          .from('trade_chats')
          .select('id')
          .eq('trade_offer_id', offerData.id)
          .eq('initiator_id', userData.user.id)
          .maybeSingle()
        if (chat) setExistingChatId(chat.id)
      }

      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleStartChat() {
    setStarting(true)
    const { data, error } = await supabaseClient
      .from('trade_chats')
      .insert({
        trade_offer_id: offer.id,
        initiator_id: user.id,
        offer_owner_id: offer.user_id,
      })
      .select()
      .single()

    setStarting(false)
    if (!error && data) {
      router.push(`/t/pokemon-go/chats/${data.id}`)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <p className="text-sm text-[#8A8C9C]">Loading...</p>
      </main>
    )
  }

  if (!offer) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <p className="text-sm text-[#8A8C9C]">Trade offer not found.</p>
      </main>
    )
  }

  const isOwnOffer = user && user.id === offer.user_id

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/t/pokemon-go/trades" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          ← Back to trades
        </Link>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <p className="text-xs text-[#8A8C9C] mb-1">Offered by</p>
          <Link href={`/t/pokemon-go/${offer.profiles?.username}`} className="font-medium text-[#EDEAE3] hover:text-[#E8A33D]">
            {offer.profiles?.username}
          </Link>
          {offer.profiles?.go_level && (
            <p className="text-xs text-[#8A8C9C] mt-1">Trainer level: {offer.profiles.go_level}</p>
          )}
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 space-y-3">
          <div>
            <p className="text-xs text-[#8A8C9C] mb-1">Has</p>
            <p className="text-lg font-semibold text-[#E8A33D]">{offer.have_pokemon}</p>
          </div>
          <div>
            <p className="text-xs text-[#8A8C9C] mb-1">Wants</p>
            <p className="text-lg font-semibold text-[#4FA8A0]">{offer.want_pokemon}</p>
          </div>
          {offer.notes && (
            <div>
              <p className="text-xs text-[#8A8C9C] mb-1">Notes</p>
              <p className="text-sm text-[#C7C9D9]">{offer.notes}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          {!user ? (
            <p className="text-sm text-[#8A8C9C]">
              <Link href="/t/pokemon-go" className="text-[#E8A33D] hover:underline">Log in</Link> to start a chat about this trade.
            </p>
          ) : isOwnOffer ? (
            <p className="text-sm text-[#8A8C9C]">This is your own trade offer.</p>
          ) : existingChatId ? (
            <Link href={`/t/pokemon-go/chats/${existingChatId}`} className="block text-center text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
              Continue chat
            </Link>
          ) : (
            <button
              onClick={handleStartChat}
              disabled={starting}
              className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F] disabled:opacity-50"
            >
              {starting ? 'Starting...' : 'Start chat about this trade'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}