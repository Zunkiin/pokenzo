'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toNOK, convertCurrency, formatPrice, COUNTRY_CURRENCY } from '@/lib/currency'

const ORDER_STORAGE_KEY = 'pokenzo_product_order'
const RETURNING_FLAG_KEY = 'pokenzo_returning'
const VISIBLE_COUNT_KEY = 'pokenzo_visible_count'
const SORT_BY_KEY = 'pokenzo_sort_by'
const COUNTRY_KEY = 'pokenzo_country'

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function relevanceScore(product, query) {
  const lowerName = product.name.toLowerCase()
  const lowerDesc = (product.description || '').toLowerCase()
  const lowerQuery = query.toLowerCase()

  if (lowerName === lowerQuery) return 0
  if (lowerName.startsWith(lowerQuery)) return 1
  if (lowerName.includes(' ' + lowerQuery)) return 2
  if (lowerName.includes(lowerQuery)) return 3
  if (lowerDesc.includes(lowerQuery)) return 4
  return 5
}

function getBestListing(product, selectedCountry) {
  const inStock = (product.listings || []).filter((l) => l.in_stock)
  const relevant = selectedCountry === 'ALL'
    ? inStock
    : inStock.filter((l) => l.stores?.country === selectedCountry || l.stores?.ships_to?.includes(selectedCountry))

  if (relevant.length === 0) return null

  let cheapest = null
  for (const listing of relevant) {
    const nokPrice = toNOK(listing.current_price, listing.currency)
    if (cheapest === null || nokPrice < cheapest.nokPrice) {
      cheapest = { nokPrice, price: listing.current_price, currency: listing.currency }
    }
  }
  return cheapest
}

function getAllCountryPrices(product) {
  const inStock = (product.listings || []).filter((l) => l.in_stock)
  const countries = ['NO', 'SE', 'DK']
  const flags = { NO: '🇳🇴', SE: '🇸🇪', DK: '🇩🇰' }

  return countries.map((c) => {
    const relevant = inStock.filter((l) => l.stores?.country === c || l.stores?.ships_to?.includes(c))
    if (relevant.length === 0) return null

    let cheapest = null
    for (const listing of relevant) {
      const nokPrice = toNOK(listing.current_price, listing.currency)
      if (cheapest === null || nokPrice < cheapest.nokPrice) cheapest = { price: listing.current_price, currency: listing.currency }
    }
    const converted = convertCurrency(cheapest.price, cheapest.currency, COUNTRY_CURRENCY[c])
    return { flag: flags[c], display: formatPrice(converted, COUNTRY_CURRENCY[c]) }
  }).filter(Boolean)
}

function enrichProduct(product, selectedCountry) {
  const best = getBestListing(product, selectedCountry)
  const allCountryPrices = getAllCountryPrices(product)
  const relevantListingsCount = selectedCountry === 'ALL'
    ? (product.listings || []).length
    : (product.listings || []).filter((l) => l.stores?.country === selectedCountry || l.stores?.ships_to?.includes(selectedCountry)).length

  let priceDisplay = null
  if (best) {
    if (selectedCountry === 'ALL') {
      priceDisplay = formatPrice(best.nokPrice, 'NOK')
    } else {
      const targetCurrency = COUNTRY_CURRENCY[selectedCountry]
      const converted = convertCurrency(best.price, best.currency, targetCurrency)
      priceDisplay = formatPrice(converted, targetCurrency)
    }
  }

  return {
    ...product,
    cheapestPriceNOK: best ? best.nokPrice : null,
    cheapestPriceDisplay: priceDisplay,
    allCountryPrices,
    storeCount: relevantListingsCount,
  }
}

export default function ProductList({ products }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('random')
  const [country, setCountry] = useState('ALL')
  const [randomOrder, setRandomOrder] = useState(products)
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => {
    const isReturning = sessionStorage.getItem(RETURNING_FLAG_KEY) === 'true'
    if (isReturning) {
      const storedCount = sessionStorage.getItem(VISIBLE_COUNT_KEY)
      if (storedCount) setVisibleCount(Number(storedCount))
      const storedSort = sessionStorage.getItem(SORT_BY_KEY)
      if (storedSort) setSortBy(storedSort)
    }
    const storedCountry = localStorage.getItem(COUNTRY_KEY)
    if (storedCountry) setCountry(storedCountry)
  }, [])

  useEffect(() => {
    const isReturning = sessionStorage.getItem(RETURNING_FLAG_KEY) === 'true'
    const stored = sessionStorage.getItem(ORDER_STORAGE_KEY)

    if (isReturning && stored) {
      sessionStorage.removeItem(RETURNING_FLAG_KEY)
      try {
        const storedIds = JSON.parse(stored)
        const productMap = new Map(products.map((p) => [p.id, p]))
        const restoredOrder = storedIds.map((id) => productMap.get(id)).filter(Boolean)
        const missingProducts = products.filter((p) => !storedIds.includes(p.id))
        setRandomOrder([...restoredOrder, ...missingProducts])
        return
      } catch {
        // fall through to fresh shuffle
      }
    }

    const fresh = shuffleArray(products)
    setRandomOrder(fresh)
    sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(fresh.map((p) => p.id)))
  }, [products])

  function handleSortChange(e) {
    const value = e.target.value
    setSortBy(value)
    if (value === 'random') {
      const fresh = shuffleArray(products)
      setRandomOrder(fresh)
      sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(fresh.map((p) => p.id)))
    }
  }

  function handleCountryChange(value) {
    setCountry(value)
    localStorage.setItem(COUNTRY_KEY, value)
  }

  function handleProductClick() {
    sessionStorage.setItem(RETURNING_FLAG_KEY, 'true')
    sessionStorage.setItem(VISIBLE_COUNT_KEY, String(visibleCount))
    sessionStorage.setItem(SORT_BY_KEY, sortBy)
  }

  const base = sortBy === 'random' ? randomOrder : products
  const enriched = base.map((p) => enrichProduct(p, country))
  const availableOnly = country === 'ALL' ? enriched : enriched.filter((p) => p.cheapestPriceDisplay !== null)

  const filtered = availableOnly.filter((p) => {
    const lowerQuery = query.toLowerCase()
    const nameMatch = p.name.toLowerCase().includes(lowerQuery)
    const descMatch = (p.description || '').toLowerCase().includes(lowerQuery)
    return nameMatch || descMatch
  })

  let sorted = filtered
  if (sortBy === 'clicked') {
    sorted = [...filtered].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
  } else if (sortBy === 'price_asc') {
    sorted = [...filtered].sort((a, b) => (a.cheapestPriceNOK ?? Infinity) - (b.cheapestPriceNOK ?? Infinity))
  } else if (sortBy === 'price_desc') {
    sorted = [...filtered].sort((a, b) => (b.cheapestPriceNOK ?? -Infinity) - (a.cheapestPriceNOK ?? -Infinity))
  } else if (sortBy === 'relevance') {
    sorted = [...filtered].sort((a, b) => relevanceScore(a, query) - relevanceScore(b, query))
  }

  const visible = visibleCount === -1 ? sorted : sorted.slice(0, visibleCount)

  const countryOptions = [
    { value: 'ALL', label: '🌍 All' },
    { value: 'NO', label: '🇳🇴 Norway' },
    { value: 'SE', label: '🇸🇪 Sweden' },
    { value: 'DK', label: '🇩🇰 Denmark' },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {countryOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleCountryChange(opt.value)}
            className={
              country === opt.value
                ? 'flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#E8A33D] text-[#14151F]'
                : 'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#1E2030] text-[#C7C9D9] border border-[#2A2C3D] hover:border-[#E8A33D] transition-colors'
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a product..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#1E2030] border border-[#2A2C3D] text-[#EDEAE3] placeholder-[#5C5E70] text-sm focus:outline-none focus:border-[#E8A33D]"
        />
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="px-3 py-2.5 rounded-xl bg-[#1E2030] border border-[#2A2C3D] text-[#EDEAE3] text-sm focus:outline-none focus:border-[#E8A33D]"
        >
          <option value="random">Random</option>
          <option value="relevance">Relevance</option>
          <option value="clicked">Most Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
        <select
          value={visibleCount}
          onChange={(e) => setVisibleCount(Number(e.target.value))}
          className="px-3 py-2.5 rounded-xl bg-[#1E2030] border border-[#2A2C3D] text-[#EDEAE3] text-sm focus:outline-none focus:border-[#E8A33D]"
        >
          <option value={12}>Show 12</option>
          <option value={24}>Show 24</option>
          <option value={48}>Show 48</option>
          <option value={-1}>Show all</option>
        </select>
      </div>

      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
        {visible.length === 0 && (
          <p className="text-sm text-[#8A8C9C]">No products found for this country.</p>
        )}
        {visible.map((product) => (
          <Link
            key={product.id}
            href={'/product/' + product.slug}
            onClick={handleProductClick}
            className="flex items-center gap-3 rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-3"
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              <p className="text-xs text-[#8A8C9C]">
                {product.language === 'JP' ? 'Japanese' : product.language === 'EN' ? 'English' : ''} · {product.storeCount} {product.storeCount === 1 ? 'store' : 'stores'}
              </p>
            </div>
            {country === 'ALL' && product.allCountryPrices?.length > 0 ? (
            <div className="text-right flex-shrink-0">
              {product.allCountryPrices.map((p, i) => (
                <p key={i} className="text-xs font-mono font-semibold text-[#E8A33D] whitespace-nowrap">
                  {p.flag} {p.display}
                </p>
              ))}
            </div>
          ) : product.cheapestPriceDisplay && (
            <p className="font-mono text-sm font-semibold text-[#E8A33D] whitespace-nowrap">
              {product.cheapestPriceDisplay}
            </p>
          )}
          </Link>
        ))}
      </div>

      {visibleCount !== -1 && sorted.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(visibleCount + 12)}
          className="w-full mt-4 text-sm font-medium px-4 py-2.5 rounded-xl bg-[#1E2030] border border-[#2A2C3D] text-[#C7C9D9] hover:border-[#E8A33D] transition-colors"
        >
          Show more
        </button>
      )}
    </div>
  )
}