'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function TradeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [offer, setOffer] = useState(null)
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [existingChatId, setExistingChatId] = useState(null)
  const [relatedChats, setRelatedChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseClient.auth.getUser()
      setUser(userData.user)

      if (userData.user) {
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('is_guest')
          .eq('id', userData.user.id)
          .maybeSingle()
        setIsGuest(profileData?.is_guest || false)
      }

      const { data: offerData } = await supabaseClient
        .from('trade_offers')
        .select('id, have_pokemon, have_shiny, want_pokemon, want_shiny, notes, user_id, status, profiles(username, go_level)')
        .eq('id', params.id)
        .maybeSingle()
      setOffer(offerData)

      if (userData.user && offerData) {
        const isOwnOffer = userData.user.id === offerData.user_id

        if (isOwnOffer) {
          const { data: chats } = await supabaseClient
            .from('trade_chats')
            .select('id, initiator_id, status')
            .eq('trade_offer_id', offerData.id)

          const chatsWithNames = await Promise.all(
            (chats || []).map(async (chat) => {
              const { data: initiatorProfile } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('id', chat.initiator_id)
                .maybeSingle()
              return { ...chat, initiatorUsername: initiatorProfile?.username || 'Unknown' }
            })
          )
          setRelatedChats(chatsWithNames)
        } else {
          const { data: chat } = await supabaseClient
            .from('trade_chats')
            .select('id')
            .eq('trade_offer_id', offerData.id)
            .eq('initiator_id', userData.user.id)
            .maybeSingle()
          if (chat) setExistingChatId(chat.id)
        }
      }

      setLoading(false)
    }
    load()

    const channel = supabaseClient
      .channel('trade_offer_chats_' + params.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trade_chats', filter: `trade_offer_id=eq.${params.id}` }, (payload) => {
        setRelatedChats((prev) => prev.map((chat) => chat.id === payload.new.id ? { ...chat, status: payload.new.status } : chat))
      })
      .subscribe()

    return () => { supabaseClient.removeChannel(channel) }
  }, [params.id])

  async function handleStartChat() {
    setStarting(true)
    setStartError('')

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

    if (error) {
      setStartError('Could not start chat. Guest accounts cannot use trading - create a full account to unlock it.')
      return
    }

    if (data) {
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
          <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back to trades</span>
        </Link>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <p className="text-xs text-[#8A8C9C] mb-1">Offered by</p>
          <Link href={`/t/pokemon-go/${offer.profiles?.username}`} className="font-medium text-[#EDEAE3] hover:text-[#E8A33D]">
            {offer.profiles?.username}
          </Link>
          {offer.profiles?.go_level && (
            <p className="text-xs text-[#8A8C9C] mt-1">Trainer level: {offer.profiles.go_level}</p>
          )}
          <div>
            <p className="text-xs text-[#8A8C9C] mb-1">Has</p>
            <p className="text-lg font-semibold text-[#E8A33D]">{offer.have_pokemon}{offer.have_shiny && ' ✨ Shiny'}</p>
          </div>
          <div>
            <p className="text-xs text-[#8A8C9C] mb-1">Wants</p>
            <p className="text-lg font-semibold text-[#4FA8A0]">{offer.want_pokemon}{offer.want_shiny && ' ✨ Shiny'}</p>
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
          ) : isGuest ? (
            <div>
              <p className="text-sm text-[#8A8C9C] mb-2">Trading isn't available for guest accounts.</p>
              <Link href="/t/pokemon-go" className="text-xs text-[#E8A33D] hover:underline">
                Create a full account to unlock trading →
              </Link>
            </div>
          ) : isOwnOffer ? (
            <div>
              <p className="text-sm text-[#8A8C9C] mb-3">This is your own trade offer.</p>
              {relatedChats.length === 0 ? (
                <p className="text-xs text-[#8A8C9C]">No one has started a chat about this yet.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[#8A8C9C] mb-2">Chats about this offer:</p>
                  {relatedChats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/t/pokemon-go/chats/${chat.id}`}
                      className="flex items-center justify-between text-sm bg-[#14151F] rounded-lg p-3 hover:bg-[#2A2C3D] transition-colors"
                    >
                      <span>{chat.initiatorUsername}</span>
                      <span className="text-xs text-[#8A8C9C]">{chat.status}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : existingChatId ? (
            <Link href={`/t/pokemon-go/chats/${existingChatId}`} className="block text-center text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
              Continue chat
            </Link>
          ) : offer.status === 'completed' ? (
            <p className="text-sm text-[#8A8C9C]">This trade has already been completed and is no longer available.</p>
          ) : (
            <>
              <button
                onClick={handleStartChat}
                disabled={starting}
                className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F] disabled:opacity-50"
              >
                {starting ? 'Starting...' : 'Start chat about this trade'}
              </button>
              {startError && <p className="text-xs text-[#C1554A] mt-2">{startError}</p>}
            </>
          )}
        </div>
      </div>
    </main>
  )
}