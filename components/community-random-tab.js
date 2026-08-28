'use client'
import { useState, useEffect, useRef } from 'react'
import PostCard from '@/components/community-post-card'

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function CommunityRandomTab({ messages, cardProps }) {
  const [shuffled, setShuffled] = useState([])
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    setShuffled(shuffle(messages))
    setIndex(0)
  }, [messages])

  if (shuffled.length === 0) {
    return <p className="text-sm text-[#8A8C9C]">No posts to show yet.</p>
  }

  const current = shuffled[index]
  const count = shuffled.length

  function goNext() {
    setIndex((i) => (i + 1) % count)
  }
  function goPrev() {
    setIndex((i) => (i - 1 + count) % count)
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#8A8C9C]">Random post {index + 1} of {count}</p>
        <button
          onClick={() => setShuffled(shuffle(messages))}
          className="text-xs font-medium text-[#4FA8A0] hover:underline"
        >
          🔀 Reshuffle
        </button>
      </div>

      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={goPrev}
          aria-label="Previous"
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 -translate-x-full w-9 h-9 items-center justify-center rounded-full bg-[#1E2030] border border-[#2A2C3D] text-[#C7C9D9] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <PostCard key={current.id} msg={current} {...cardProps(current)} />

        <button
          onClick={goNext}
          aria-label="Next"
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full w-9 h-9 items-center justify-center rounded-full bg-[#1E2030] border border-[#2A2C3D] text-[#C7C9D9] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <p className="text-center text-xs text-[#5C5E70] mt-3 sm:hidden">Swipe left or right for another random post</p>
    </div>
  )
}