'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toNOK, convertCurrency, formatPrice, COUNTRY_CURRENCY } from '@/lib/currency'

const COUNTRY_KEY = 'pokenzo_country'

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function getCheapestPriceDisplay(product, country) {
  const inStock = (product.listings || []).filter((l) => l.in_stock)
  const relevant = country === 'ALL'
    ? inStock
    : inStock.filter((l) => l.stores?.country === country || l.stores?.ships_to?.includes(country))

  if (relevant.length === 0) return null

  let cheapest = null
  for (const listing of relevant) {
    const nokPrice = toNOK(listing.current_price, listing.currency)
    if (cheapest === null || nokPrice < cheapest.nokPrice) {
      cheapest = { nokPrice, price: listing.current_price, currency: listing.currency }
    }
  }

  // Always show the cheapest listing's own real price/currency, not a
  // converted number - a converted value doesn't match any actual price
  // tag a user could pay, which looks confusing/wrong when multiple
  // currencies are involved (NOK conversion is only used above to decide
  // which listing is genuinely cheapest).
  if (country === 'ALL') return formatPrice(cheapest.price, cheapest.currency)
  const targetCurrency = COUNTRY_CURRENCY[country]
  const converted = convertCurrency(cheapest.price, cheapest.currency, targetCurrency)
  return formatPrice(converted, targetCurrency)
}

function getOtherCurrencies(product, shownDisplay) {
  const shownCurrency = shownDisplay ? shownDisplay.split(' ').pop() : null
  const inStock = (product.listings || []).filter((l) => l.in_stock)
  return [...new Set(inStock.map((l) => l.currency))].filter((c) => c !== shownCurrency)
}

export default function HeroCarousel({ products }) {
  const router = useRouter()
  const [shuffledProducts, setShuffledProducts] = useState(products)
  const [index, setIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [country, setCountry] = useState('ALL')
  const touchStartX = useRef(null)
  const containerRef = useRef(null)
  const hasMovedRef = useRef(false)

  useEffect(() => {
    const storedCountry = localStorage.getItem(COUNTRY_KEY)
    if (storedCountry) setCountry(storedCountry)

    function handleCountryChange(e) {
      setCountry(e.detail)
    }
    window.addEventListener('pokenzo-country-change', handleCountryChange)
    return () => window.removeEventListener('pokenzo-country-change', handleCountryChange)
  }, [])

  useEffect(() => {
    setShuffledProducts(shuffle(products))
    setIndex(0)
  }, [products])

  const visibleProducts = shuffledProducts.filter((p) => getCheapestPriceDisplay(p, country) !== null)

  useEffect(() => {
    if (isDragging) return
    if (visibleProducts.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % visibleProducts.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [visibleProducts.length, isDragging, index])

  useEffect(() => {
    setIndex(0)
  }, [country])

  if (!visibleProducts || visibleProducts.length === 0) return null

  const count = visibleProducts.length

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
    router.push('/product/' + visibleProducts[index].slug)
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
        {visibleProducts.map((p) => (
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
              {getCheapestPriceDisplay(p, country) && (
                <p className="text-sm text-[#C7C9D9] mt-1">
                  Starting at <span className="font-mono text-[#E8A33D] font-semibold">{getCheapestPriceDisplay(p, country)}</span>
                </p>
              )}
              {country === 'ALL' && getOtherCurrencies(p, getCheapestPriceDisplay(p, country)).length > 0 && (
                <p className="text-xs text-[#8A8C9C] mt-0.5">
                  Also available in {getOtherCurrencies(p, getCheapestPriceDisplay(p, country)).join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + count) % count) }}
            aria-label="Previous"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white transition-colors z-10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % count) }}
            aria-label="Next"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white transition-colors z-10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {count > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {visibleProducts.map((p, i) => (
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