'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function HeroCarousel({ products }) {
  const router = useRouter()
  const [shuffledProducts, setShuffledProducts] = useState(products)
  const [index, setIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef(null)
  const containerRef = useRef(null)
  const hasMovedRef = useRef(false)

  useEffect(() => {
    setShuffledProducts(shuffle(products))
    setIndex(0)
  }, [products])

  useEffect(() => {
    if (isDragging) return
    if (shuffledProducts.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % shuffledProducts.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [shuffledProducts.length, isDragging])

  if (!shuffledProducts || shuffledProducts.length === 0) return null

  const count = shuffledProducts.length

  function handleTouchStart(e) {
    touchStartX.current = e.targetTouches[0].clientX
    hasMovedRef.current = false
    setIsDragging(true)
  }

  function handleTouchMove(e) {
    if (touchStartX.current === null) return
    const currentX = e.targetTouches[0].clientX
    const delta = currentX - touchStartX.current
    if (Math.abs(delta) > 5) hasMovedRef.current = true
    setDragOffset(delta)
  }

  function handleTouchEnd() {
    const width = containerRef.current ? containerRef.current.offsetWidth : 300
    const threshold = width * 0.2

    if (dragOffset < -threshold) {
      setIndex((i) => (i + 1) % count)
    } else if (dragOffset > threshold) {
      setIndex((i) => (i - 1 + count) % count)
    }

    setDragOffset(0)
    touchStartX.current = null
    setIsDragging(false)
  }

  function handleClick() {
    if (hasMovedRef.current) return
    router.push('/product/' + shuffledProducts[index].slug)
  }

  const trackStyle = {
    display: 'flex',
    width: count * 100 + '%',
    transform: `translateX(calc(-${index * (100 / count)}% + ${dragOffset}px))`,
    transition: isDragging ? 'none' : 'transform 400ms ease',
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className="relative h-64 sm:h-80 overflow-hidden rounded-b-2xl max-w-md md:max-w-3xl lg:max-w-5xl mx-auto cursor-pointer select-none"
    >
      <div style={trackStyle}>
        {shuffledProducts.map((p) => (
          <div key={p.id} style={{ width: 100 / count + '%' }} className="relative h-64 sm:h-80 flex-shrink-0">
            <img
              src={p.image_url}
              alt={p.name}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14151F] via-[#14151F]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#E8A33D] font-semibold mb-1">
                Pokenzo
              </p>
              <h2 className="text-xl font-semibold text-[#EDEAE3] leading-snug">
                {p.name}
              </h2>
              {p.cheapestPriceDisplay && (
                <p className="text-sm text-[#C7C9D9] mt-1">
                  Fra <span className="font-mono text-[#E8A33D] font-semibold">{p.cheapestPriceDisplay}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {shuffledProducts.map((p, i) => (
            <span
              key={p.id}
              className={'h-1.5 rounded-full transition-all ' + (i === index ? 'w-4 bg-[#E8A33D]' : 'w-1.5 bg-white/30')}
            />
          ))}
        </div>
      )}

    
    </div>
  )
}