'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const ORDER_STORAGE_KEY = 'pokenzo_product_order'
const RETURNING_FLAG_KEY = 'pokenzo_returning'

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

export default function ProductList({ products }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('random')
  const [randomOrder, setRandomOrder] = useState(products)
  const [visibleCount, setVisibleCount] = useState(12)

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

function handleProductClick() {
  sessionStorage.setItem(RETURNING_FLAG_KEY, 'true')
}

  function handleSortChange(e) {
    const value = e.target.value
    setSortBy(value)
    if (value === 'random') {
      const fresh = shuffleArray(products)
      setRandomOrder(fresh)
      sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(fresh.map((p) => p.id)))
    }
  }

  const base = sortBy === 'random' ? randomOrder : products
  const filtered = base.filter((p) => {
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

  return (
    <div>
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
          <p className="text-sm text-[#8A8C9C]">No products found.</p>
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
            {product.cheapestPriceDisplay && (
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