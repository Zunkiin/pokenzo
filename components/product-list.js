'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function ProductList({ products }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('random')
  const [randomOrder, setRandomOrder] = useState(products)

  useEffect(() => {
  setRandomOrder(shuffleArray(products))
}, [products])

  function handleSortChange(e) {
    const value = e.target.value
    setSortBy(value)
    if (value === 'random') {
      setRandomOrder(shuffleArray(products))
    }
  }

  const base = sortBy === 'random' ? randomOrder : products
  const filtered = base.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))

  let sorted = filtered
  if (sortBy === 'clicked') {
    sorted = [...filtered].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
  } else if (sortBy === 'price_asc') {
    sorted = [...filtered].sort((a, b) => (a.cheapestPriceNOK ?? Infinity) - (b.cheapestPriceNOK ?? Infinity))
  } else if (sortBy === 'price_desc') {
    sorted = [...filtered].sort((a, b) => (b.cheapestPriceNOK ?? -Infinity) - (a.cheapestPriceNOK ?? -Infinity))
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
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
          <option value="clicked">Most clicked</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
        {sorted.length === 0 && (
          <p className="text-sm text-[#8A8C9C]">No products found.</p>
        )}

        {sorted.map((product) => (
          <Link
            key={product.id}
            href={'/produkt/' + product.slug}
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
    </div>
  )
}