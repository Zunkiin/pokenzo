'use client'
import Link from 'next/link'

export default function PostCard({
  msg,
  user,
  isAdmin,
  isGuest,
  reportedIds,
  copiedId,
  expanded,
  commentInput,
  onContentClick,
  onContentDoubleClick,
  heartPop,
  onToggleLike,
  onToggleExpanded,
  onShare,
  onDelete,
  onReport,
  onBlock,
  onToggleCommentLike,
  onDeleteComment,
  onCommentInputChange,
  onPostComment,
}) {
  return (
    <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
      <div
        onClick={onContentClick}
        onDoubleClick={onContentDoubleClick}
        className="cursor-pointer relative"
      >
        {heartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-6xl animate-ping" style={{ animationDuration: '0.7s', animationIterationCount: 1 }}>❤️</span>
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <Link
            href={`/pokemon-go/${msg.profiles?.username}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs font-medium text-[#4FA8A0] hover:underline"
          >
            {(msg.profiles?.avatar_trainer_url || msg.profiles?.avatar_pokemon_url) && (
              <div className="flex items-center -space-x-1">
                {msg.profiles?.avatar_trainer_url && (
                  <img src={msg.profiles.avatar_trainer_url} alt="" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                )}
                {msg.profiles?.avatar_pokemon_url && (
                  <img src={msg.profiles.avatar_pokemon_url} alt="" className="w-6 h-6 object-contain" onError={(e) => e.target.style.display = 'none'} />
                )}
              </div>
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
      </div>

      <div className="flex items-center gap-4 text-xs mb-2">
        <button
          onClick={() => user && onToggleLike(msg.id, msg.iLiked)}
          disabled={!user}
          className={msg.iLiked ? 'text-[#E8A33D] font-semibold' : 'text-[#8A8C9C]'}
        >
          {msg.iLiked ? '❤️' : '🤍'} {msg.likeCount}
        </button>
        <button onClick={() => onToggleExpanded(msg.id)} className="text-[#8A8C9C]">
          💬 {msg.comments.length}
        </button>
        <button onClick={() => onShare(msg.id)} className="text-[#8A8C9C] hover:text-[#4FA8A0]">
          {copiedId === msg.id ? '✓ Copied' : '🔗 Share'}
        </button>
        {user && (
          msg.user_id === user.id || isAdmin ? (
            <button onClick={() => onDelete(msg.id)} className="text-[#C1554A] hover:text-[#E8836F] ml-auto">
              Delete{isAdmin && msg.user_id !== user.id ? ' (admin)' : ''}
            </button>
          ) : (
            <>
              <button
                onClick={() => onReport(msg.id)}
                disabled={reportedIds.includes(msg.id)}
                className="text-[#8A8C9C] hover:text-[#E8A33D] disabled:opacity-50 ml-auto"
              >
                {reportedIds.includes(msg.id) ? 'Reported' : 'Report'}
              </button>
              <button onClick={() => onBlock(msg.user_id)} className="text-[#8A8C9C] hover:text-[#C1554A]">
                Block
              </button>
            </>
          )
        )}
      </div>

      {expanded && (
        <div className="border-t border-[#2A2C3D] pt-2 space-y-2">
          {msg.comments.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[#4FA8A0]">{c.profiles?.username}: </span>
                <span className="text-[#C7C9D9]">{c.comment}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <button
                  onClick={() => user && onToggleCommentLike(c.id, c.iLiked)}
                  disabled={!user}
                  className={c.iLiked ? 'text-[#E8A33D]' : 'text-[#5C5E70]'}
                >
                  {c.iLiked ? '❤️' : '🤍'} {c.likeCount}
                </button>
                {user && (c.user_id === user.id || isAdmin) && (
                  <button onClick={() => onDeleteComment(c.id)} className="text-[#C1554A] hover:text-[#E8836F]">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {user && !isGuest && (
            <div className="flex gap-2 mt-2">
              <input
                value={commentInput || ''}
                onChange={(e) => onCommentInputChange(msg.id, e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-2 py-1.5 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-xs placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
              />
              <button
                onClick={() => onPostComment(msg.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#E8A33D] text-[#14151F]"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}