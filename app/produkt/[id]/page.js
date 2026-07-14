import { supabase } from '@/lib/supabase'

function formatPrice(price, currency) {
  if (price == null) return '–'
  return Math.round(price).toLocaleString('nb-NO') + ' ' + currency
}

function formatCheckedAt(dateString) {
  if (!dateString) return 'Ikke sjekket ennå'
  const date = new Date(dateString)
  return date.toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
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
    .order('current_price', { ascending: true })

  if (!product) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-6">
        <p className="text-center">Fant ikke produktet.</p>
      </main>
    )
  }

  const cheapestId = listings && listings.length > 0 ? listings[0].id : null

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pb-16 pt-8">
      <div className="max-w-md mx-auto">

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8A8C9C] mb-2">
            {product.language === 'JP' ? 'Japansk' : product.language === 'EN' ? 'Engelsk' : ''} · {product.product_type}
          </p>
          <h1 className="text-2xl font-semibold leading-tight mb-4">
            {product.name}
          </h1>
          {listings && listings.length > 0 && (
            <p className="text-sm text-[#8A8C9C]">
              Fra <span className="text-[#E8A33D] font-mono text-base font-semibold">{formatPrice(listings[0].current_price, listings[0].currency)}</span> hos {listings.length} {listings.length === 1 ? 'butikk' : 'butikker'}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {(!listings || listings.length === 0) && (
            <p className="text-sm text-[#8A8C9C]">Ingen butikker sporet for dette produktet ennå.</p>
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

            const storeName = listing.stores ? listing.stores.name : 'Ukjent butikk'
            const storeCountry = listing.stores ? listing.stores.country : null
            const countryBadgeClass = getCountryBadgeClass(storeCountry)
            const buttonText = listing.in_stock ? 'Kjøp hos ' + storeName : 'Utsolgt'

            return (
              <div key={listing.id} className={cardClass}>
                {isCheapest && (
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#E8A33D] font-semibold mb-2">
                    Beste pris
                  </p>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      <span className={countryBadgeClass}>{storeCountry}</span>
                      {storeName}
                    </p>
                    <p className={stockTextClass}>
                      {listing.in_stock ? 'På lager' : 'Utsolgt'}
                    </p>
                  </div>
                  <p className="font-mono text-lg font-semibold whitespace-nowrap">
                    {formatPrice(listing.current_price, listing.currency)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-[11px] text-[#5C5E70]">
                    Sjekket {formatCheckedAt(listing.last_checked_at)}
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