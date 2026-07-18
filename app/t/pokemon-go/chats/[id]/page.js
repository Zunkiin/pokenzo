'use client'
import { useState, useEffect, useRef } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ChatPage() {
  const params = useParams()
  const [user, setUser] = useState(null)
  const [chat, setChat] = useState(null)
  const [otherUsername, setOtherUsername] = useState('')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [completingTrade, setCompletingTrade] = useState(false)
  const bottomRef = useRef(null)
  const [myFeedback, setMyFeedback] = useState(null)
  const [otherFeedback, setOtherFeedback] = useState(null)
  const [feedbackComment, setFeedbackComment] = useState('')

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseClient.auth.getUser()
      setUser(userData.user)

      const { data: chatData } = await supabaseClient
        .from('trade_chats')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()

      const { data: allFeedback } = await supabaseClient
         .from('trade_feedback')
         .select('*')
        .eq('chat_id', params.id)

       const mine = allFeedback?.find((f) => f.user_id === userData.user.id)
       const others = allFeedback?.find((f) => f.user_id !== userData.user.id)
            setMyFeedback(mine || null)
            setOtherFeedback(others || null)

      if (!chatData) { setLoading(false); return }
      setChat(chatData)

      const otherId = chatData.initiator_id === userData.user?.id ? chatData.offer_owner_id : chatData.initiator_id
      const { data: otherProfile } = await supabaseClient
        .from('profiles')
        .select('username')
        .eq('id', otherId)
        .maybeSingle()
      setOtherUsername(otherProfile?.username || 'Unknown')

      const { data: msgs } = await supabaseClient
  .from('trade_messages')
  .select('*')
  .eq('chat_id', params.id)
  .order('created_at', { ascending: true })
setMessages(msgs || [])

const isInitiator = chatData.initiator_id === userData.user.id
const readField = isInitiator ? 'initiator_last_read' : 'owner_last_read'
await supabaseClient.from('trade_chats').update({ [readField]: new Date().toISOString() }).eq('id', params.id)

setLoading(false)
    }
    load()

    const channel = supabaseClient
  .channel('trade_chat_' + params.id)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trade_messages', filter: `chat_id=eq.${params.id}` }, (payload) => {
    setMessages((prev) => [...prev, payload.new])
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trade_chats', filter: `id=eq.${params.id}` }, (payload) => {
    setChat((prev) => ({ ...prev, ...payload.new }))
  })
  .subscribe()

return () => { supabaseClient.removeChannel(channel) }
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim()) return
    await supabaseClient.from('trade_messages').insert({
      chat_id: params.id,
      sender_id: user.id,
      message: newMessage.trim(),
    })
    setNewMessage('')
  }

  async function handleAccept() {
  await supabaseClient.from('trade_chats').update({ status: 'accepted' }).eq('id', params.id)
  setChat((prev) => ({ ...prev, status: 'accepted' }))
}

async function handleDeny() {
  await supabaseClient.from('trade_chats').update({ status: 'denied' }).eq('id', params.id)
  setChat((prev) => ({ ...prev, status: 'denied' }))
}

async function handleCompleteTrade() {
  setCompletingTrade(true)
  await supabaseClient.from('trade_offers').update({ status: 'completed' }).eq('id', chat.trade_offer_id)
  await supabaseClient.from('trade_chats').update({ status: 'completed' }).eq('id', params.id)
  setChat((prev) => ({ ...prev, status: 'completed' }))
  setCompletingTrade(false)
}

async function handleSubmitFeedback(wentWell) {
  const { data, error } = await supabaseClient
    .from('trade_feedback')
    .insert({
      chat_id: params.id,
      user_id: user.id,
      went_well: wentWell,
      comment: feedbackComment || null,
    })
    .select()
    .single()

  if (!error) {
    setMyFeedback(data)

    if (otherFeedback) {
      await supabaseClient.from('trade_chats').update({ status: 'closed' }).eq('id', params.id)
      setChat((prev) => ({ ...prev, status: 'closed' }))
    }
  }
}

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <p className="text-sm text-[#8A8C9C]">Loading...</p>
      </main>
    )
  }

  if (!chat) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <p className="text-sm text-[#8A8C9C]">Chat not found, or you don't have access to it.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        <Link href="/t/pokemon-go/trades" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D] mb-4">
          ← Back to trades
        </Link>

        <h1 className="text-lg font-semibold mb-4">Chat with {otherUsername}</h1>

{chat.status === 'pending' && chat.offer_owner_id === user.id && (
  <div className="flex gap-2 mb-4">
    <button onClick={handleAccept} className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-[#4FA8A0] text-[#14151F]">
      Accept
    </button>
    <button onClick={handleDeny} className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-[#C1554A] text-[#14151F]">
      Deny
    </button>
  </div>
)}
{chat.status === 'accepted' && (
  <div className="mb-4">
    <p className="text-xs text-[#4FA8A0] mb-2">✓ Trade accepted</p>
    <button onClick={handleCompleteTrade} disabled={completingTrade} className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#4FA8A0] text-[#14151F] disabled:opacity-50">
        {completingTrade ? 'Completing...' : 'Mark trade as completed'}
    </button>
  </div>
)}
{chat.status === 'denied' && (
  <p className="text-xs text-[#C1554A] mb-4">✗ Trade denied</p>
)}
{chat.status === 'completed' && (
  <div className="mb-4 rounded-lg bg-[#4FA8A0]/10 border border-[#4FA8A0] p-3">
    <p className="text-sm font-semibold text-[#4FA8A0] text-center mb-3">🎉 Trade completed!</p>

    {!myFeedback ? (
      <div className="space-y-2">
        <p className="text-xs text-[#C7C9D9] text-center mb-2">Did this trade go well?</p>
        <div className="flex gap-2">
          <button onClick={() => handleSubmitFeedback(true)} className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-[#4FA8A0] text-[#14151F]">
            👍 Yes
          </button>
          <button onClick={() => handleSubmitFeedback(false)} className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-[#C1554A] text-[#14151F]">
            👎 No
          </button>
        </div>
      </div>
    ) : (
      <p className="text-xs text-[#8A8C9C] text-center">
        You said this trade {myFeedback.went_well ? 'went well 👍' : 'did not go well 👎'}
      </p>
    )}

    {otherFeedback ? (
      <p className="text-xs text-[#8A8C9C] text-center mt-2">
        {otherUsername} said this trade {otherFeedback.went_well ? 'went well 👍' : 'did not go well 👎'}
      </p>
    ) : (
      <p className="text-xs text-[#5C5E70] text-center mt-2">
        Waiting for {otherUsername}'s feedback...
      </p>
    )}

    {myFeedback && otherFeedback && (
      <p className="text-xs text-[#4FA8A0] text-center mt-2 font-semibold">
        ✓ Both parties confirmed
      </p>
    )}
  </div>
)}

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 min-h-[300px] max-h-[50vh]">
          {messages.length === 0 && (
            <p className="text-sm text-[#8A8C9C]">No messages yet. Say hi!</p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user.id
            return (
              <div key={msg.id} className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[75%] rounded-lg px-3 py-2 text-sm ' + (isMine ? 'bg-[#E8A33D] text-[#14151F]' : 'bg-[#2A2C3D] text-[#EDEAE3]')}>
                  {msg.message}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {chat.status === 'denied' || chat.status === 'closed' ? (
  <p className="text-sm text-[#8A8C9C] text-center py-2">
    {chat.status === 'closed' ? 'Both parties confirmed the trade. This chat is now closed.' : 'This trade was denied. The chat is now closed.'}
  </p>
) : (
  <form onSubmit={handleSend} className="flex gap-2">
    <input
      value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Type a message..."
      className="flex-1 px-3 py-2 rounded-lg bg-[#1E2030] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
    />
    <button type="submit" className="text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
      Send
    </button>
  </form>
)}
      </div>
    </main>
  )
}