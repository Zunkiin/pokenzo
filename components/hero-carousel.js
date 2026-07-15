'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function herocarousel({ products }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (products.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % products.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [products.length])

  if (!products || products.length === 0) return null

  const product = products[index]

  return (
    <Link href={'/produkt/' + product.id} className="block relative h-64 sm:h-80 overflow-hidden rounded-b-2xl max-w-md md:max-w-3xl lg:max-w-5xl mx-auto">
      {products.map((p, i) => (
        <img
          key={p.id}
          src={p.image_url}
          alt={p.name}
          className={
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ' +
            (i === index ? 'opacity-100' : 'opacity-0')
          }
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#14151F] via-[#14151F]/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E8A33D] font-semibold mb-1">
          Pokenzo
        </p>
        <h2 className="text-xl font-semibold text-[#EDEAE3] leading-snug">
          {product.name}
        </h2>
        {product.cheapestPriceDisplay && (
          <p className="text-sm text-[#C7C9D9] mt-1">
            Fra <span className="font-mono text-[#E8A33D] font-semibold">{product.cheapestPriceDisplay}</span>
          </p>
        )}
      </div>
      {products.length > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {products.map((p, i) => (
            <span
              key={p.id}
              className={'h-1.5 rounded-full transition-all ' + (i === index ? 'w-4 bg-[#E8A33D]' : 'w-1.5 bg-white/30')}
            />
          ))}
        </div>
      )}
    </Link>
  )
}