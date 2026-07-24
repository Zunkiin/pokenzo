'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'
import { containsLink } from '@/lib/contentFilters'
import CommunityNav from '@/components/community-nav'
import { ArrowLeft } from 'lucide-react'

export default function CommunityPage() {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [postError, setPostError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reportedIds, setReportedIds] = useState([])
  const [uploading, setUploading] = useState(false)
  const [imageBlocked, setImageBlocked] = useState(false)
  const [commentInputs, setCommentInputs] = useState({})
  const [expandedComments, setExpandedComments] = useState({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  async function loadMessages(userId) {
    const { data: msgs } = await supabaseClient
      .from('community_messages')
      .select('id, user_id, message, image_url, created_at, profiles(username, avatar_trainer_url)')
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: blocks } = userId
      ? await supabaseClient.from('user_blocks').select('blocked_id').eq('blocker_id', userId)
      : { data: [] }
    const blockedSet = (blocks || []).map((b) => b.blocked_id)

    const visible = (msgs || []).filter((m) => !blockedSet.includes(m.user_id))

    const withExtras = await Promise.all(
      visible.map(async (m) => {
        const { count: likeCount } = await supabaseClient
          .from('message_likes')
          .select('id', { count: 'exact', head: true })
          .eq('message_id', m.id)

        let iLiked = false
        if (userId) {
          const { data: myLike } = await supabaseClient
            .from('message_likes')
            .select('id')
            .eq('message_id', m.id)
            .eq('user_id', userId)
            .maybeSingle()
          iLiked = !!myLike
        }

        function handleShare(messageId) {
          const url = `${window.location.origin}/pokemon-go/community-chat/${messageId}`
          navigator.clipboard.writeText(url)
          setCopiedId(messageId)
          setTimeout(() => setCopiedId(null), 2000)
        }

        const { data: comments } = await supabaseClient
          .from('message_comments')
          .select('id, comment, user_id, created_at, profiles(username)')
          .eq('message_id', m.id)
          .order('created_at', { ascending: true })

        const commentsWithLikes = await Promise.all(
          (comments || []).map(async (c) => {
            const { count: cLikeCount } = await supabaseClient
              .from('comment_likes')
              .select('id', { count: 'exact', head: true })
              .eq('comment_id', c.id)

            let cLiked = false
            if (userId) {
              const { data: myCLike } = await supabaseClient
                .from('comment_likes')
                .select('id')
                .eq('comment_id', c.id)
                .eq('user_id', userId)
                .maybeSingle()
              cLiked = !!myCLike
            }

            return { ...c, likeCount: cLikeCount || 0, iLiked: cLiked }
          })
        )

        return { ...m, likeCount: likeCount || 0, iLiked, comments: commentsWithLikes }
      })
    )

    setMessages(withExtras)

  
  }

  useEffect(() => {
    supabaseClient.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('is_admin, is_guest')
          .eq('id', data.user.id)
          .maybeSingle()
        setIsAdmin(profile?.is_admin || false)
        setIsGuest(profile?.is_guest || false)
      }
      await loadMessages(data.user?.id)
      setLoading(false)
    })

    const channel = supabaseClient
      .channel('community_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages' }, async () => {
        const { data } = await supabaseClient.auth.getUser()
        await loadMessages(data.user?.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_likes' }, async () => {
        const { data } = await supabaseClient.auth.getUser()
        await loadMessages(data.user?.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_comments' }, async () => {
        const { data } = await supabaseClient.auth.getUser()
        await loadMessages(data.user?.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_likes' }, async () => {
        const { data } = await supabaseClient.auth.getUser()
        await loadMessages(data.user?.id)
      })
      .subscribe()

    return () => { supabaseClient.removeChannel(channel) }
  }, [])

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setPostError('Image must be under 5 MB.')
      return
    }

    setUploading(true)
    setPostError('')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabaseClient.storage
      .from('community-images')
      .upload(fileName, file)

    if (uploadError) {
      setPostError('Failed to upload image: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabaseClient.storage.from('community-images').getPublicUrl(fileName)

    const modRes = await fetch('/api/moderate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: data.publicUrl }),
    })
    const modResult = await modRes.json()

    if (!modResult.approved) {
      await supabaseClient.storage.from('community-images').remove([fileName])
      setPostError('This image was flagged by our automatic moderation and cannot be posted.')
      setImageBlocked(true)
      setUploading(false)
      return
    }

    setImageBlocked(false)
    setNewImageUrl(data.publicUrl)
    setUploading(false)
  }

  async function handlePost(e) {
    e.preventDefault()

    if (imageBlocked) {
      setPostError('Your image was blocked by moderation. Please remove it or choose a different image before posting.')
      return
    }

    setPostError('')

    if (!newMessage.trim() && !newImageUrl.trim()) {
      setPostError('Write something or add an image.')
      return
    }

    if (containsLink(newMessage)) {
      setPostError('Links are not allowed in posts.')
      return
    }

    const { error } = await supabaseClient.from('community_messages').insert({
      user_id: user.id,
      message: newMessage.trim() || null,
      image_url: newImageUrl.trim() || null,
    })

    if (error) {
      setPostError(error.message)
    } else {
      setNewMessage('')
      setNewImageUrl('')
      setImageBlocked(false)
      await loadMessages(user.id)
    }
  }

  async function handleReport(messageId) {
    const { error } = await supabaseClient.from('message_reports').insert({
      message_id: messageId,
      reporter_id: user.id,
    })
    if (!error) {
      setReportedIds((prev) => [...prev, messageId])
    }
  }

  async function handleBlock(blockedUserId) {
    await supabaseClient.from('user_blocks').insert({
      blocker_id: user.id,
      blocked_id: blockedUserId,
    })
    await loadMessages(user.id)
  }

  async function handleDelete(messageId) {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    await supabaseClient.from('community_messages').delete().eq('id', messageId)
    await loadMessages(user?.id)
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    await supabaseClient.from('message_comments').delete().eq('id', commentId)
    await loadMessages(user?.id)
  }

  async function handleToggleLike(messageId, currentlyLiked) {
    if (currentlyLiked) {
      await supabaseClient.from('message_likes').delete().eq('message_id', messageId).eq('user_id', user.id)
    } else {
      await supabaseClient.from('message_likes').insert({ message_id: messageId, user_id: user.id })
    }
    await loadMessages(user.id)
  }

  async function handlePostComment(messageId) {
    const text = (commentInputs[messageId] || '').trim()
    if (!text) return

    if (containsLink(text)) {
      setPostError('Links are not allowed in comments.')
      return
    }

    await supabaseClient.from('message_comments').insert({
      message_id: messageId,
      user_id: user.id,
      comment: text,
    })
    setCommentInputs((prev) => ({ ...prev, [messageId]: '' }))
    await loadMessages(user.id)
  }

  async function handleToggleCommentLike(commentId, currentlyLiked) {
    if (currentlyLiked) {
      await supabaseClient.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id)
    } else {
      await supabaseClient.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
    }
    await loadMessages(user.id)
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

        <h1 className="text-xl font-semibold">Community Chat</h1>
        <PokemonGoNav />
        <CommunityNav />

        {user && isGuest && (
          <div className="rounded-xl border border-[#E8A33D] bg-[#E8A33D]/10 p-4">
            <p className="text-sm text-[#EDEAE3] mb-1">Community Chat isn't available for guest accounts.</p>
            <Link href="/pokemon-go" className="text-xs text-[#E8A33D] hover:underline">
              Create a full account to unlock this →
            </Link>
          </div>
        )}

        {user && !isGuest && (
          <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
            <h2 className="text-sm font-semibold mb-3">Share your catches and favorites 🎉</h2>
            <form onSubmit={handlePost} className="space-y-3">
              <textarea
                value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message here"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D] resize-none"
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full text-sm text-[#8A8C9C] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#2A2C3D] file:text-[#EDEAE3] file:text-sm"
                />
                {uploading && <p className="text-xs text-[#8A8C9C] mt-1">Uploading...</p>}
                {newImageUrl && !uploading && (
                  <img src={newImageUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg mt-2" />
                )}
              </div>
              {postError && <p className="text-xs text-[#C1554A]">{postError}</p>}
              <button type="submit" disabled={uploading} className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F] disabled:opacity-50">
                {uploading ? 'Please wait, processing image...' : 'Post'}
              </button>
            </form>
          </div>
        )}

        {!user && (
          <p className="text-sm text-[#8A8C9C]">
            <Link href="/pokemon-go" className="text-[#E8A33D] hover:underline">Log in</Link> to post and interact.
          </p>
        )}

        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-[#8A8C9C]">No posts yet. Be the first to share!</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
              <div className="flex items-center justify-between mb-2">
                <Link href={`/pokemon-go/${msg.profiles?.username}`} className="flex items-center gap-1.5 text-xs font-medium text-[#4FA8A0] hover:underline">
                  {msg.profiles?.avatar_trainer_url && (
                    <img src={msg.profiles.avatar_trainer_url} alt="" className="w-5 h-5 object-contain" onError={(e) => e.target.style.display = 'none'} />
                  )}
                  {msg.profiles?.username}
                </Link>
                <span className="text-[10px] text-[#5C5E70]">
                  {new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {msg.message && <p className="text-sm text-[#EDEAE3] mb-2">{msg.message}</p>}
              {msg.image_url && (
                <img src={msg.image_url} alt="" className="w-full rounded-lg mb-2" onError={(e) => e.target.style.display = 'none'} />
              )}

              <div className="flex items-center gap-4 text-xs mb-2">
                <button
                  onClick={() => user && handleToggleLike(msg.id, msg.iLiked)}
                  disabled={!user}
                  className={msg.iLiked ? 'text-[#E8A33D] font-semibold' : 'text-[#8A8C9C]'}
                >
                  {msg.iLiked ? '❤️' : '🤍'} {msg.likeCount}
                </button>
                <button
                  onClick={() => setExpandedComments((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                  className="text-[#8A8C9C]"
                >
                  💬 {msg.comments.length}
                </button>
                <button onClick={() => handleShare(msg.id)} className="text-[#8A8C9C] hover:text-[#4FA8A0]">
                  {copiedId === msg.id ? '✓ Copied' : '🔗 Share'}
                </button>
                {user && (
                  msg.user_id === user.id || isAdmin ? (
                    <button onClick={() => handleDelete(msg.id)} className="text-[#C1554A] hover:text-[#E8836F] ml-auto">
                      Delete{isAdmin && msg.user_id !== user.id ? ' (admin)' : ''}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReport(msg.id)}
                        disabled={reportedIds.includes(msg.id)}
                        className="text-[#8A8C9C] hover:text-[#E8A33D] disabled:opacity-50 ml-auto"
                      >
                        {reportedIds.includes(msg.id) ? 'Reported' : 'Report'}
                      </button>
                      <button onClick={() => handleBlock(msg.user_id)} className="text-[#8A8C9C] hover:text-[#C1554A]">
                        Block
                      </button>
                    </>
                  )
                )}
              </div>

              {expandedComments[msg.id] && (
                <div className="border-t border-[#2A2C3D] pt-2 space-y-2">
                  {msg.comments.map((c) => (
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
                  {user && !isGuest && (
                    <div className="flex gap-2 mt-2">
                      <input
                        value={commentInputs[msg.id] || ''}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 px-2 py-1.5 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-xs placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                      />
                      <button
                        onClick={() => handlePostComment(msg.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#E8A33D] text-[#14151F]"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}