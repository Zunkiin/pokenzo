'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

const tabs = [
  { label: 'Profile', href: '/t/pokemon-go' },
  { label: 'Trade Offers', href: '/t/pokemon-go/trades' },
  { label: 'Raids', href: '/t/pokemon-go/raids' },
  { label: 'My Chats', href: '/t/pokemon-go/chats' },
]

export default function PokemonGoNav() {
  const pathname = usePathname()
  const [unreadTotal, setUnreadTotal] = useState(0)

  useEffect(() => {
    async function loadUnread() {
      const { data: userData } = await supabaseClient.auth.getUser()
      if (!userData.user) return

      const { data: chatRows } = await supabaseClient
        .from('trade_chats')
        .select('id, initiator_id, offer_owner_id, initiator_last_read, owner_last_read')
        .or(`initiator_id.eq.${userData.user.id},offer_owner_id.eq.${userData.user.id}`)

      let total = 0
      for (const chat of chatRows || []) {
        const isInitiator = chat.initiator_id === userData.user.id
        const myLastRead = isInitiator ? chat.initiator_last_read : chat.owner_last_read

        const { count } = await supabaseClient
          .from('trade_messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('sender_id', userData.user.id)
          .gt('created_at', myLastRead || '1970-01-01')

        total += count || 0
      }
      setUnreadTotal(total)
    }
    loadUnread()
  }, [pathname])

  return (
    <div className="flex gap-2 overflow-x-auto pt-2 pb-1 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        const className = isActive
          ? 'flex-shrink-0 relative text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#E8A33D] text-[#14151F]'
          : 'flex-shrink-0 relative text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#1E2030] text-[#C7C9D9] border border-[#2A2C3D] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors'

        return (
          <Link key={tab.href} href={tab.href} className={className}>
            {tab.label}
            {tab.label === 'My Chats' && unreadTotal > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#C1554A] text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadTotal}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}