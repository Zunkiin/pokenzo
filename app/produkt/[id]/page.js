import { supabase } from '@/lib/supabase'
import { toNOK, formatPrice } from '@/lib/currency'

function formatCheckedAt(dateString) {
  if (!dateString) return 'Not checked yet'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function getCountryBadgeClass(country) {
  if (country === 'SE') {
    return 'inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-[#006AA7] text-[#FECC02] mr-2 align-middle'
  }
  if (country === 'DK') {
    return 'inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-[#C60C30] text-white mr-2 align-middle'
  }
  if (country === 'NO') {
    return 'inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded border border-[#EDEAE3] text-[#EDEAE3] bg-transparent mr-2 align-middle'
  }
  return 'inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-[#2A2C3D] text-[#8A8C9C] mr-2 align-middle'
}

export default async function ProductPage({ params }) {
  const { id } = await params

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, product_url, currency, current_price, in_stock, last_checked_at, stores(name, country)')
    .eq('product_id', id)

  if (!product) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-6">
        <p className="text-center">Product not found.</p>
      </main>
    )
  }

  if (listings) {
    listings.sort((a, b) => {
      const priceA = a.in_stock ? toNOK(a.current_price, a.currency) : Infinity
      const priceB = b.in_stock ? toNOK(b.current_price, b.currency) : Infinity
      return priceA - priceB
    })
  }

  const cheapestId = listings && listings.length > 0 ? listings[0].id : null

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pb-16 pt-16">
      <div className="max-w-md mx-auto">

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8A8C9C] mb-2">
            {product.language === 'JP' ? 'Japanese' : product.language === 'EN' ? 'English' : ''} · {product.product_type}
          </p>
          <h1 className="text-2xl font-semibold leading-tight mb-4">
            {product.name}
          </h1>
          {listings && listings.length > 0 && (
            <p className="text-sm text-[#8A8C9C]">
              From <span className="text-[#E8A33D] font-mono text-base font-semibold">{formatPrice(listings[0].current_price, listings[0].currency)}</span> at {listings.length} {listings.length === 1 ? 'store' : 'stores'}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {(!listings || listings.length === 0) && (
            <p className="text-sm text-[#8A8C9C]">No stores tracked for this product yet.</p>
          )}

          {listings && listings.map((listing) => {
            const isCheapest = listing.id === cheapestId && listing.in_stock

            const cardClass = isCheapest
              ? 'rounded-xl border p-4 border-[#E8A33D] bg-[#1E2030]'
              : 'rounded-xl border p-4 border-[#2A2C3D] bg-[#1E2030]'

            const stockTextClass = listing.in_stock ? 'text-xs mt-1 text-[#4FA8A0]' : 'text-xs mt-1 text-[#C1554A]'

            const buttonClass = listing.in_stock
              ? 'text-xs font-medium px-3 py-1.5 rounded-full transition-colors bg-[#E8A33D] text-[#14151F]'
              : 'text-xs font-medium px-3 py-1.5 rounded-full transition-colors bg-[#2A2C3D] text-[#8A8C9C] pointer-events-none'

            const storeName = listing.stores ? listing.stores.name : 'Unknown store'
            const storeCountry = listing.stores ? listing.stores.country : null
            const countryBadgeClass = getCountryBadgeClass(storeCountry)
            const buttonText = listing.in_stock ? 'Buy at ' + storeName : 'Out of stock'

            return (
              <div key={listing.id} className={cardClass}>
                {isCheapest && (
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#E8A33D] font-semibold mb-2">
                    Best price
                  </p>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      <span className={countryBadgeClass}>{storeCountry}</span>
                      {storeName}
                    </p>
                    <p className={stockTextClass}>
                      {listing.in_stock ? 'In stock' : 'Out of stock'}
                    </p>
                  </div>
                  <p className="font-mono text-lg font-semibold whitespace-nowrap">
                    {formatPrice(listing.current_price, listing.currency)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-[11px] text-[#5C5E70]">
                    Checked {formatCheckedAt(listing.last_checked_at)}
                  </p>
                  <a href={listing.product_url} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                    {buttonText}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}