'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'
import { ArrowLeft } from 'lucide-react'

export default function ChatsListPage() {
  const [user, setUser] = useState(null)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseClient.auth.getUser()
      setUser(userData.user)

      if (!userData.user) {
        setLoading(false)
        return
      }

      const { data: chatRows } = await supabaseClient
        .from('trade_chats')
        .select('id, initiator_id, offer_owner_id, initiator_last_read, owner_last_read, trade_offer_id, status, trade_offers(have_pokemon, want_pokemon)')
        .or(`initiator_id.eq.${userData.user.id},offer_owner_id.eq.${userData.user.id}`)
        .not('status', 'in', '(closed,denied)')
        .order('created_at', { ascending: false })

      const withNames = await Promise.all(
        (chatRows || []).map(async (chat) => {
          const isInitiator = chat.initiator_id === userData.user.id
          const otherId = isInitiator ? chat.offer_owner_id : chat.initiator_id
          const myLastRead = isInitiator ? chat.initiator_last_read : chat.owner_last_read

          const { data: otherProfile } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', otherId)
            .maybeSingle()

          const { count } = await supabaseClient
            .from('trade_messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .neq('sender_id', userData.user.id)
            .gt('created_at', myLastRead || '1970-01-01')

          return { ...chat, otherUsername: otherProfile?.username || 'Unknown', unreadCount: count || 0 }
        })
      )

      setChats(withNames)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <p className="text-sm text-[#8A8C9C]">Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <p className="text-sm text-[#8A8C9C]">
          <Link href="/t/pokemon-go" className="text-[#E8A33D] hover:underline">Log in</Link> to see your chats.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-4">
        <Link href="/t/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back</span>
        </Link>

        <h1 className="text-xl font-semibold">My Chats</h1>
        <PokemonGoNav />

        {chats.length === 0 && (
          <p className="text-sm text-[#8A8C9C]">No chats yet.</p>
        )}

        <div className="space-y-3">
          {chats.map((chat) => (
            <Link
                 key={chat.id}
                href={`/t/pokemon-go/chats/${chat.id}`}
                className="flex items-center justify-between rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors"
           >
            <div>
            <p className="font-medium mb-1">
                <span className="text-[#E8A33D]">{chat.trade_offers?.have_pokemon}</span> ↔ <span className="text-[#4FA8A0]">{chat.trade_offers?.want_pokemon}</span>
            </p>
            <p className="text-xs text-[#8A8C9C]">{chat.otherUsername}</p>
        </div>
        {chat.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#C1554A] text-white text-xs font-semibold flex items-center justify-center">
                {chat.unreadCount}
                </span>
         )}
        </Link>
          ))}
        </div>
      </div>
    </main>
  )
}