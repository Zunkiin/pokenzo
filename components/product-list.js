'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ProductList({ products }) {
  const [query, setQuery] = useState('')

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a product..."
        className="w-full mb-4 px-4 py-2.5 rounded-xl bg-[#1E2030] border border-[#2A2C3D] text-[#EDEAE3] placeholder-[#5C5E70] text-sm focus:outline-none focus:border-[#E8A33D]"
      />

      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
        {filtered.length === 0 && (
          <p className="text-sm text-[#8A8C9C]">No products found.</p>
        )}

        {filtered.map((product) => (
          <Link
            key={product.id}
            href={'/produkt/' + product.id}
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