'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toNOK, convertCurrency, formatPrice, COUNTRY_CURRENCY } from '@/lib/currency'

const COUNTRY_KEY = 'pokenzo_country'
const SHOW_COUNT = 5

const COUNTRY_OPTIONS = [
  { value: 'ALL', label: '🌍 All' },
  { value: 'NO', label: '🇳🇴' },
  { value: 'SE', label: '🇸🇪' },
  { value: 'DK', label: '🇩🇰' },
]

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function relevantFor(product, country) {
  const listings = product.listings || []
  return country === 'ALL'
    ? listings
    : listings.filter((l) => l.stores?.country === country || l.stores?.ships_to?.includes(country))
}

function cheapestOf(listings) {
  let cheapest = null
  for (const l of listings) {
    const nok = toNOK(l.current_price, l.currency)
    if (cheapest === null || nok < cheapest.nok) {
      cheapest = { nok, price: l.current_price, currency: l.currency }
    }
  }
  return cheapest
}

function enrich(product, country) {
  const all = relevantFor(product, country)
  const best = cheapestOf(all.filter((l) => l.in_stock))

  let priceDisplay = null
  if (best) {
    if (country === 'ALL') {
      priceDisplay = formatPrice(best.nok, 'NOK')
    } else {
      const target = COUNTRY_CURRENCY[country]
      priceDisplay = formatPrice(convertCurrency(best.price, best.currency, target), target)
    }
  }
  return { ...product, storeCount: all.length, priceDisplay }
}

export default function RadioProducts({ products }) {
  const [order, setOrder] = useState(products)
  const [country, setCountry] = useState('ALL')
  const [inStockOnly, setInStockOnly] = useState(false)

  // Nytt tilfeldig utvalg for hver visning (etter første render, så server og klient stemmer).
  useEffect(() => {
    setOrder(shuffleArray(products))
  }, [products])

  useEffect(() => {
    const stored = localStorage.getItem(COUNTRY_KEY)
    if (stored) setCountry(stored)
    function onChange(e) {
      setCountry(e.detail)
    }
    window.addEventListener('pokenzo-country-change', onChange)
    return () => window.removeEventListener('pokenzo-country-change', onChange)
  }, [])

  function handleCountry(value) {
    setCountry(value)
    localStorage.setItem(COUNTRY_KEY, value)
    window.dispatchEvent(new CustomEvent('pokenzo-country-change', { detail: value }))
  }

  const enriched = order.map((p) => enrich(p, country))
  const byCountry = country === 'ALL' ? enriched : enriched.filter((p) => p.storeCount > 0)
  const filtered = inStockOnly ? byCountry.filter((p) => p.priceDisplay !== null) : byCountry
  const visible = filtered.slice(0, SHOW_COUNT)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {COUNTRY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleCountry(opt.value)}
            className={
              country === opt.value
                ? 'text-xs font-semibold px-3 py-1.5 rounded-full bg-[#E8A33D] text-[#14151F] border border-[#E8A33D]'
                : 'text-xs font-medium px-3 py-1.5 rounded-full bg-[#14151F] text-[#C7C9D9] border border-[#4A4D67] hover:border-[#E8A33D] transition-colors'
            }
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOrder(shuffleArray(products))}
          aria-label="Shuffle products"
          className="ml-auto text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#1E2030] text-[#C7C9D9] border border-[#4A4D67] hover:border-[#E8A33D] transition-colors"
        >
          ↻ Shuffle
        </button>
        <button
          type="button"
          onClick={() => setInStockOnly((prev) => !prev)}
          className={
            inStockOnly
              ? 'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#4FA8A0]/15 text-[#4FA8A0] border border-[#4FA8A0]'
              : 'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#1E2030] text-[#C7C9D9] border border-[#4A4D67] hover:border-[#4FA8A0] transition-colors'
          }
        >
          <span className={'w-1.5 h-1.5 rounded-full ' + (inStockOnly ? 'bg-[#4FA8A0]' : 'bg-[#5C5E70]')} />
          In Stock
        </button>
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="text-sm text-[#8A8C9C]">No products found.</p>
        )}
        {visible.map((product) => (
          <Link
            key={product.id}
            href={'/product/' + product.slug}
            className="flex items-center gap-3 rounded-xl border border-[#2A2C3D] bg-[#14151F] p-3"
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              <p className="text-xs text-[#8A8C9C]">
                {product.language === 'JP' ? 'Japanese' : product.language === 'EN' ? 'English' : product.language === 'CN' ? 'Chinese' : ''} · {product.storeCount} {product.storeCount === 1 ? 'store' : 'stores'}
              </p>
            </div>
            {product.priceDisplay ? (
              <p className="font-mono text-sm font-semibold text-[#E8A33D] whitespace-nowrap">{product.priceDisplay}</p>
            ) : (
              <p className="text-xs font-medium text-[#C1554A] whitespace-nowrap">Out of stock</p>
            )}
          </Link>
        ))}
      </div>

      <Link
        href="/"
        className="block w-full text-center text-sm font-medium px-4 py-2.5 rounded-xl bg-[#14151F] border border-[#2A2C3D] text-[#C7C9D9] hover:border-[#E8A33D] transition-colors"
      >
        See all products →
      </Link>
    </div>
  )
}