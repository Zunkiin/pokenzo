import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toNOK, convertCurrency, formatPrice, COUNTRY_CURRENCY } from '@/lib/currency'

const FLAGS = { NO: '🇳🇴', SE: '🇸🇪', DK: '🇩🇰' }

function getSuggestionCountryPrices(listings) {
  const inStock = (listings || []).filter((l) => l.in_stock)
  const countries = ['NO', 'SE', 'DK']

  return countries.map((c) => {
    const relevant = inStock.filter((l) => l.stores?.country === c || l.stores?.ships_to?.includes(c))
    if (relevant.length === 0) return null

    let cheapest = null
    for (const listing of relevant) {
      const nokPrice = toNOK(listing.current_price, listing.currency)
      if (cheapest === null || nokPrice < cheapest.nokPrice) {
        cheapest = { nokPrice, price: listing.current_price, currency: listing.currency }
      }
    }
    const targetCurrency = COUNTRY_CURRENCY[c]
    const converted = convertCurrency(cheapest.price, cheapest.currency, targetCurrency)
    return { flag: FLAGS[c], display: formatPrice(converted, targetCurrency) }
  }).filter(Boolean)
}

export default async function ProductSuggestions({ productType, excludeId }) {
  const { data: allMatching } = await supabase
    .from('products')
    .select('id, slug, name, image_url, product_type, language')
    .eq('product_type', productType)
    .neq('id', excludeId)

  const shuffled = allMatching
    ? [...allMatching].sort(() => Math.random() - 0.5).slice(0, 4)
    : []

  const suggestions = await Promise.all(
    shuffled.map(async (s) => {
      const { data: sListings } = await supabase
        .from('listings')
        .select('current_price, currency, in_stock, stores(country, ships_to)')
        .eq('product_id', s.id)

      const countryPrices = getSuggestionCountryPrices(sListings)

      return { ...s, countryPrices }
    })
  )

  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-[#8A8C9C] mb-3">You might also like</h2>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <Link
            key={s.id}
            href={'/product/' + s.slug}
            className="flex items-center gap-3 rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-3 hover:border-[#E8A33D] transition-colors"
          >
            {s.image_url && (
              <img src={s.image_url} alt={s.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{s.name}</p>
              <p className="text-xs text-[#8A8C9C]">
                {s.language === 'JP' ? 'Japanese' : s.language === 'EN' ? 'English' : s.language === 'CN' ? 'Chinese' : ''}
              </p>
            </div>
            {s.countryPrices && s.countryPrices.length > 0 && (
              <div className="text-right flex-shrink-0">
                {s.countryPrices.map((p, i) => (
                  <p key={i} className="font-mono text-xs font-semibold text-[#E8A33D] whitespace-nowrap">
                    {p.flag} {p.display}
                  </p>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}