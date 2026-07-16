'use client'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    setShuffledProducts(shuffle(products))
  }, [products])

  useEffect(() => {
    if (shuffledProducts.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % shuffledProducts.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [shuffledProducts.length])

  if (!shuffledProducts || shuffledProducts.length === 0) return null

  const product = shuffledProducts[index]

  return (
    <div
      onClick={() => router.push('/produkt/' + product.slug)}
      className="block relative h-64 sm:h-80 overflow-hidden rounded-b-2xl max-w-md md:max-w-3xl lg:max-w-5xl mx-auto cursor-pointer"
    >
      {shuffledProducts.map((p, i) => (
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
      {shuffledProducts.length > 1 && (
        <div className="absolute top-3 right-3 flex gap-1">
          {shuffledProducts.map((p, i) => (
            <span
              key={p.id}
              className={'h-1.5 rounded-full transition-all ' + (i === index ? 'w-4 bg-[#E8A33D]' : 'w-1.5 bg-white/30')}
            />
          ))}
        </div>
      )}
      <Link
  href="/pokemon-go"
  onClick={(e) => e.stopPropagation()}
  className="absolute bottom-5 right-4 z-10 text-xs font-medium px-3 py-1.5 rounded-full bg-[#1E2030]/80 backdrop-blur border border-[#4A4D67] text-[#C7C9D9]"
>
  Pokémon GO Hub
</Link>
    </div>
  )
}