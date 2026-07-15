import { supabase } from '@/lib/supabase'
import { toNOK, formatPrice } from '@/lib/currency'
import HeroCarousel from '@/components/herocarousel'
import Link from 'next/link'

export default async function HomePage() {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, product_type, language, image_url, listings(current_price, currency, in_stock)')

  const productsWithPrice = (products || []).map((product) => {
    const inStockListings = (product.listings || []).filter((l) => l.in_stock)
    let cheapest = null
    for (const listing of inStockListings) {
      const nokPrice = toNOK(listing.current_price, listing.currency)
      if (cheapest === null || nokPrice < cheapest.nokPrice) {
        cheapest = { nokPrice, price: listing.current_price, currency: listing.currency }
      }
    }
    return {
      id: product.id,
      name: product.name,
      language: product.language,
      image_url: product.image_url,
      storeCount: product.listings ? product.listings.length : 0,
      cheapestPriceDisplay: cheapest ? formatPrice(cheapest.price, cheapest.currency) : null,
    }
  })

  const carouselProducts = productsWithPrice.filter((p) => p.image_url)

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] pb-16">
      <HeroCarousel products={carouselProducts} />

      <div className="max-w-md mx-auto px-4 mt-6">
        <h1 className="text-lg font-semibold mb-4">Alle produkter</h1>

        <div className="space-y-3">
          {productsWithPrice.length === 0 && (
            <p className="text-sm text-[#8A8C9C]">Ingen produkter lagt inn ennå.</p>
          )}

          {productsWithPrice.map((product) => (
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
                  {product.language === 'JP' ? 'Japansk' : product.language === 'EN' ? 'Engelsk' : ''} · {product.storeCount} {product.storeCount === 1 ? 'butikk' : 'butikker'}
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
    </main>
  )
}