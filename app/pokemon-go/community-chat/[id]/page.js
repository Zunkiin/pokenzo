'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SinglePostPage() {
  const params = useParams()
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState(null)
  const [likeCount, setLikeCount] = useState(0)
  const [iLiked, setILiked] = useState(false)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  async function loadPost() {
  const { data: userData } = await supabaseClient.auth.getUser()
  setUser(userData.user)

  if (userData.user) {
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .maybeSingle()
    setIsAdmin(profileData?.is_admin || false)
  }

  const { data: msg } = await supabaseClient
    .from('community_messages')
    .select('id, user_id, message, image_url, created_at, hidden, profiles(username, avatar_trainer_url, avatar_pokemon_url)')
    .eq('id', params.id)
    .maybeSingle()

  if (!msg || msg.hidden) {
    setMessage(null)
    setLoading(false)
    return
  }

  setMessage(msg)

  const { count } = await supabaseClient
    .from('message_likes')
    .select('id', { count: 'exact', head: true })
    .eq('message_id', msg.id)
  setLikeCount(count || 0)

  if (userData.user) {
    const { data: myLike } = await supabaseClient
      .from('message_likes')
      .select('id')
      .eq('message_id', msg.id)
      .eq('user_id', userData.user.id)
      .maybeSingle()
    setILiked(!!myLike)
  }

  const { data: commentData } = await supabaseClient
    .from('message_comments')
    .select('id, comment, user_id, profiles(username)')
    .eq('message_id', msg.id)
    .order('created_at', { ascending: true })

  const commentsWithLikes = await Promise.all(
    (commentData || []).map(async (c) => {
      const { count: cLikeCount } = await supabaseClient
        .from('comment_likes')
        .select('id', { count: 'exact', head: true })
        .eq('comment_id', c.id)

      let cLiked = false
      if (userData.user) {
        const { data: myCLike } = await supabaseClient
          .from('comment_likes')
          .select('id')
          .eq('comment_id', c.id)
          .eq('user_id', userData.user.id)
          .maybeSingle()
        cLiked = !!myCLike
      }

      return { ...c, likeCount: cLikeCount || 0, iLiked: cLiked }
    })
  )
  setComments(commentsWithLikes)

  setLoading(false)
}

  useEffect(() => {
    loadPost()
  }, [params.id])

  async function handleToggleLike() {
    if (!user) return
    if (iLiked) {
      await supabaseClient.from('message_likes').delete().eq('message_id', message.id).eq('user_id', user.id)
    } else {
      await supabaseClient.from('message_likes').insert({ message_id: message.id, user_id: user.id })
    }
    await loadPost()
  }

  async function handlePostComment() {
    if (!commentInput.trim() || !user) return
    await supabaseClient.from('message_comments').insert({
      message_id: message.id,
      user_id: user.id,
      comment: commentInput.trim(),
    })
    setCommentInput('')
    await loadPost()
  }

  async function handleToggleCommentLike(commentId, currentlyLiked) {
  if (currentlyLiked) {
    await supabaseClient.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id)
  } else {
    await supabaseClient.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
  }
  await loadPost()
}

async function handleDeleteComment(commentId) {
  if (!window.confirm('Are you sure you want to delete this comment?')) return
  await supabaseClient.from('message_comments').delete().eq('id', commentId)
  await loadPost()
}

async function handleDeletePost() {
  if (!window.confirm('Are you sure you want to delete this post?')) return
  await supabaseClient.from('community_messages').delete().eq('id', message.id)
  window.location.href = '/pokemon-go/community-chat'
}

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <p className="text-sm text-[#8A8C9C]">Loading...</p>
      </main>
    )
  }

  if (!message) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <p className="text-sm text-[#8A8C9C]">Post not found.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-4">
        <Link href="/pokemon-go/community-chat" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back to Community Chat</span>
        </Link>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <div className="flex items-center justify-between mb-2">
            <Link href={`/pokemon-go/${message.profiles?.username}`} className="flex items-center gap-1.5 text-xs font-medium text-[#4FA8A0] hover:underline">
                {(message.profiles?.avatar_trainer_url || message.profiles?.avatar_pokemon_url) && (
                    <div className="flex items-center -space-x-1">
                    {message.profiles?.avatar_trainer_url && (
                      <img src={message.profiles.avatar_trainer_url} alt="" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    )}
                    {message.profiles?.avatar_pokemon_url && (
                      <img src={message.profiles.avatar_pokemon_url} alt="" className="w-6 h-6 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    )}
                    </div>
                )}
                {message.profiles?.username}
                </Link>
            <span className="text-[10px] text-[#5C5E70]">
              {new Date(message.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {message.message && <p className="text-sm text-[#EDEAE3] mb-2">{message.message}</p>}
          {message.image_url && (
            <img src={message.image_url} alt="" className="w-full rounded-lg mb-2" onError={(e) => e.target.style.display = 'none'} />
          )}
          <div className="flex items-center gap-4 text-xs">
            <button
                onClick={handleToggleLike}
                disabled={!user}
                className={iLiked ? 'text-[#E8A33D] font-semibold' : 'text-[#8A8C9C]'}
            >
                {iLiked ? '❤️' : '🤍'} {likeCount}
            </button>
            <button onClick={handleShare} className="text-[#8A8C9C] hover:text-[#4FA8A0]">
                {copied ? '✓ Copied' : '🔗 Share'}
            </button>
            {user && (message.user_id === user.id || isAdmin) && (
                <button onClick={handleDeletePost} className="text-[#C1554A] hover:text-[#E8836F] ml-auto">
                Delete{isAdmin && message.user_id !== user.id ? ' (admin)' : ''}
                </button>
            )}
            </div>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h2 className="text-sm font-semibold mb-3">Comments</h2>
          {comments.length === 0 && <p className="text-sm text-[#8A8C9C]">No comments yet.</p>}
          <div className="space-y-2 mb-3">
            {comments.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                <div>
                    <span className="font-semibold text-[#4FA8A0]">{c.profiles?.username}: </span>
                    <span className="text-[#C7C9D9]">{c.comment}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                    onClick={() => user && handleToggleCommentLike(c.id, c.iLiked)}
                    disabled={!user}
                    className={c.iLiked ? 'text-[#E8A33D]' : 'text-[#5C5E70]'}
                    >
                    {c.iLiked ? '❤️' : '🤍'} {c.likeCount}
                    </button>
                    {user && (c.user_id === user.id || isAdmin) && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-[#C1554A] hover:text-[#E8836F]">
                        Delete
                    </button>
                    )}
                </div>
                </div>
            ))}
            </div>
          {user && (
            <div className="flex gap-2">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-2 py-1.5 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-xs placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
              />
              <button onClick={handlePostComment} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#E8A33D] text-[#14151F]">
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}