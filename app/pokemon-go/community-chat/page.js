'use client'
import { useState, useEffect, useRef } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PokemonGoNav from '@/components/pokemon-go-nav'
import { containsLink } from '@/lib/contentFilters'
import CommunityNav from '@/components/community-nav'
import PostCard from '@/components/community-post-card'
import CommunityRandomTab from '@/components/community-random-tab'
import { ArrowLeft } from 'lucide-react'

export default function CommunityPage() {
  const router = useRouter()
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
  const [visibleCount, setVisibleCount] = useState(6)
  const [viewMode, setViewMode] = useState('feed')
  const [heartPopId, setHeartPopId] = useState(null)
  const clickTimeoutRef = useRef(null)

  function handleContentClick(msg) {
    if (clickTimeoutRef.current) {
      // Second click arrived quickly - this is a double-click, handled below.
      return
    }
    clickTimeoutRef.current = setTimeout(() => {
      router.push(`/pokemon-go/community-chat/${msg.id}`)
      clickTimeoutRef.current = null
    }, 250)
  }

  function handleContentDoubleClick(msg) {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }
    if (!user) return
    if (!msg.iLiked) {
      handleToggleLike(msg.id, msg.iLiked)
    }
    setHeartPopId(msg.id)
    setTimeout(() => setHeartPopId(null), 700)
  }

  async function loadMessages(userId) {
    const { data: msgs } = await supabaseClient
      .from('community_messages')
      .select('id, user_id, message, image_url, created_at, profiles(username, avatar_trainer_url, avatar_pokemon_url)')
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: blocks } = userId
      ? await supabaseClient.from('user_blocks').select('blocked_id').eq('blocker_id', userId)
      : { data: [] }
    const blockedSet = (blocks || []).map((b) => b.blocked_id)

    const visible = (msgs || []).filter((m) => !blockedSet.includes(m.user_id))
    const messageIds = visible.map((m) => m.id)

    if (messageIds.length === 0) {
      setMessages([])
      return
    }

    // Fetch ALL likes/comments for every visible message in a small, fixed
    // number of bulk queries - instead of looping per message (and per
    // comment) and firing a separate query for each one, which was
    // producing hundreds of round-trips and made the page painfully slow.
    const [{ data: allLikes }, { data: allComments }] = await Promise.all([
      supabaseClient.from('message_likes').select('message_id, user_id').in('message_id', messageIds),
      supabaseClient
        .from('message_comments')
        .select('id, message_id, comment, user_id, created_at, profiles(username)')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true }),
    ])

    const commentIds = (allComments || []).map((c) => c.id)
    const { data: allCommentLikes } = commentIds.length > 0
      ? await supabaseClient.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds)
      : { data: [] }

    const withExtras = visible.map((m) => {
      const messageLikes = (allLikes || []).filter((l) => l.message_id === m.id)
      const iLiked = userId ? messageLikes.some((l) => l.user_id === userId) : false

      const comments = (allComments || [])
        .filter((c) => c.message_id === m.id)
        .map((c) => {
          const cLikes = (allCommentLikes || []).filter((cl) => cl.comment_id === c.id)
          const cLiked = userId ? cLikes.some((cl) => cl.user_id === userId) : false
          return { ...c, likeCount: cLikes.length, iLiked: cLiked }
        })

      return { ...m, likeCount: messageLikes.length, iLiked, comments }
    })

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

  function handleShare(messageId) {
    const url = `${window.location.origin}/pokemon-go/community-chat/${messageId}`
    navigator.clipboard.writeText(url)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function getCardProps(msg) {
    return {
      user,
      isAdmin,
      isGuest,
      reportedIds,
      copiedId,
      expanded: !!expandedComments[msg.id],
      commentInput: commentInputs[msg.id],
      onContentClick: () => handleContentClick(msg),
      onContentDoubleClick: () => handleContentDoubleClick(msg),
      heartPop: heartPopId === msg.id,
      onToggleLike: handleToggleLike,
      onToggleExpanded: (id) => setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] })),
      onShare: handleShare,
      onDelete: handleDelete,
      onReport: handleReport,
      onBlock: handleBlock,
      onToggleCommentLike: handleToggleCommentLike,
      onDeleteComment: handleDeleteComment,
      onCommentInputChange: (id, value) => setCommentInputs((prev) => ({ ...prev, [id]: value })),
      onPostComment: handlePostComment,
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <img src="/logo.png" alt="Loading" className="w-16 h-16 animate-spin" style={{ animationDuration: '1.5s' }} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/pokemon-go" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C7C9D9] bg-[#1E2030] border border-[#2A2C3D] rounded-lg px-3 py-1.5 hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors">
          <ArrowLeft size={18} strokeWidth={2.5} /> Back
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

        <div className="flex gap-2 mb-1">
          <button
            onClick={() => setViewMode('feed')}
            className={
              viewMode === 'feed'
                ? 'text-xs font-semibold px-3 py-2 rounded-full bg-[#E8A33D] text-[#14151F]'
                : 'text-xs font-medium px-3 py-2 rounded-full border border-[#4A4D67] bg-[#1E2030] text-[#C7C9D9] hover:border-[#E8A33D] hover:text-[#E8A33D]'
            }
          >
            Feed
          </button>
          <button
            onClick={() => setViewMode('random')}
            className={
              viewMode === 'random'
                ? 'text-xs font-semibold px-3 py-2 rounded-full bg-[#E8A33D] text-[#14151F]'
                : 'text-xs font-medium px-3 py-2 rounded-full border border-[#4A4D67] bg-[#1E2030] text-[#C7C9D9] hover:border-[#E8A33D] hover:text-[#E8A33D]'
            }
          >
            🔀 Random
          </button>
        </div>

        {viewMode === 'feed' ? (
          <>
            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-[#8A8C9C]">No posts yet. Be the first to share!</p>
              )}
              {messages.slice(0, visibleCount).map((msg) => (
                <PostCard key={msg.id} msg={msg} {...getCardProps(msg)} />
              ))}
            </div>

            {visibleCount < messages.length && (
              <button
                onClick={() => setVisibleCount((c) => c + 6)}
                className="w-full text-sm font-medium px-4 py-2.5 rounded-lg bg-[#1E2030] border border-[#2A2C3D] text-[#C7C9D9] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors"
              >
                Show more
              </button>
            )}
          </>
        ) : (
          <CommunityRandomTab messages={messages} cardProps={getCardProps} />
        )}
      </div>
    </main>
  )
}