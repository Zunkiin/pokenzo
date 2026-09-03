'use client'
import { useState, useEffect } from 'react'
import { toNOK, convertCurrency, formatPrice, COUNTRY_CURRENCY } from '@/lib/currency'

const COUNTRY_KEY = 'pokenzo_country'

function formatCheckedAt(dateString) {
  if (!dateString) return 'Not checked yet'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function EstimatedBadge() {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block mr-1 align-middle">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShow((s) => !s) }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        aria-label="Estimated price"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C1554A]/20 text-[#C1554A] text-[10px] font-bold leading-none"
      >
        !
      </button>
      {show && (
        <span className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 whitespace-normal text-center text-[11px] font-sans font-normal normal-case text-[#EDEAE3] bg-[#1E2030] border border-[#2A2C3D] rounded-lg p-2 shadow-lg">
          Estimated price, converted from the original currency at the current exchange rate.
        </span>
      )}
    </span>
  )
}

function getCountryBadgeClass(country) {
  if (country === 'SE') {
    return 'inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-[#006AA7] text-[#FECC02] mr-2 align-middle'
  }
  if (country === 'DK') {
    return 'inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-[#C60C30] text-white mr-2 align-middle'
  }
  if (country === 'NO') {
    return 'inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-[#00205B] border border-[#EF2B2D] text-white mr-2 align-middle'
  }
  return 'inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-[#2A2C3D] text-[#8A8C9C] mr-2 align-middle'
}

export default function ProductListings({ listings }) {
  const [country, setCountry] = useState('ALL')

  useEffect(() => {
    const stored = localStorage.getItem(COUNTRY_KEY)
    if (stored) setCountry(stored)
  }, [])

  function handleCountryChange(value) {
    setCountry(value)
    localStorage.setItem(COUNTRY_KEY, value)
  }

  const relevant = country === 'ALL'
    ? (listings || [])
    : (listings || []).filter((l) => l.stores?.country === country || l.stores?.ships_to?.includes(country))

  const sorted = [...relevant].sort((a, b) => {
    const priceA = a.in_stock ? toNOK(a.current_price, a.currency) : Infinity
    const priceB = b.in_stock ? toNOK(b.current_price, b.currency) : Infinity
    return priceA - priceB
  })

  const cheapestId = sorted.length > 0 && sorted[0].in_stock ? sorted[0].id : null

  function getDisplayPrice(listing) {
    if (country === 'ALL') {
      return { display: formatPrice(listing.current_price, listing.currency), isEstimated: false }
    }
    const targetCurrency = COUNTRY_CURRENCY[country]
    const converted = convertCurrency(listing.current_price, listing.currency, targetCurrency)
    return { display: formatPrice(converted, targetCurrency), isEstimated: listing.currency !== targetCurrency }
  }

  const FLAGS = { NO: '🇳🇴', SE: '🇸🇪', DK: '🇩🇰' }

  function getAllCountryDisplays(listing) {
    const shipsTo = listing.stores
      ? [...new Set([listing.stores.country, ...(listing.stores.ships_to || [])])]
      : []

    return shipsTo
      .filter((c) => COUNTRY_CURRENCY[c])
      .map((c) => {
        const targetCurrency = COUNTRY_CURRENCY[c]
        const converted = convertCurrency(listing.current_price, listing.currency, targetCurrency)
        return { flag: FLAGS[c] || c, display: formatPrice(converted, targetCurrency), isEstimated: listing.currency !== targetCurrency }
      })
  }

  const countryOptions = [
    { value: 'ALL', label: '🌍 All' },
    { value: 'NO', label: '🇳🇴 Norway' },
    { value: 'SE', label: '🇸🇪 Sweden' },
    { value: 'DK', label: '🇩🇰 Denmark' },
  ]

  return (
    <>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
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

      {sorted.length > 0 && (
        <p className="text-sm text-[#8A8C9C] mb-4">
          From <span className="text-[#E8A33D] font-mono text-base font-semibold">
            {getDisplayPrice(sorted[0]).isEstimated && (
              <EstimatedBadge />
            )}
            {getDisplayPrice(sorted[0]).display}
          </span> at {sorted.length} {sorted.length === 1 ? 'store' : 'stores'}
        </p>
      )}

      <div className="space-y-3">
        {(!listings || listings.length === 0) && (
          <p className="text-sm text-[#8A8C9C]">No stores tracked for this product yet.</p>
        )}
        {listings && listings.length > 0 && sorted.length === 0 && (
          <p className="text-sm text-[#8A8C9C]">No stores tracked for this country yet.</p>
        )}
        {sorted.map((listing) => {
          const isCheapest = listing.id === cheapestId && listing.in_stock
          const cardClass = isCheapest
            ? 'rounded-xl border p-4 border-[#E8A33D] bg-[#1E2030]'
            : 'rounded-xl border p-4 border-[#2A2C3D] bg-[#1E2030]'
          const stockTextClass = listing.in_stock ? 'text-xs mt-1 text-[#4FA8A0]' : 'text-xs mt-1 text-[#C1554A]'
          const buttonClass = listing.in_stock
            ? 'text-xs font-medium px-3 py-1.5 rounded-full transition-colors bg-[#E8A33D] text-[#14151F]'
            : 'text-xs font-medium px-3 py-1.5 rounded-full transition-colors bg-[#2A2C3D] text-[#8A8C9C]'
          const storeName = listing.stores ? listing.stores.name : 'Unknown store'
          const shipsTo = listing.stores
            ? [...new Set([listing.stores.country, ...(listing.stores.ships_to || [])])]
            : []
          const buttonText = listing.in_stock ? 'Buy at ' + storeName : 'Visit store'

          return (
            <a
              key={listing.id}
              href={listing.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cardClass + ' block hover:border-[#E8A33D] transition-colors'}
            >
              {isCheapest && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#E8A33D] font-semibold mb-2">
                  Best price
                </p>
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {shipsTo.map((c) => (
                      <span key={c} className={getCountryBadgeClass(c)}>{c}</span>
                    ))}
                    {storeName}
                    {listing.stores?.is_affiliate && (
                      <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gradient-to-r from-[#E8A33D]/20 to-[#E8A33D]/5 text-[#E8A33D] border border-[#E8A33D]/50 align-middle">
                        Partner
                      </span>
                    )}
                  </p>
                  <p className={stockTextClass}>
                    {listing.in_stock ? 'In stock' : 'Out of stock'}
                  </p>
                </div>
                {country === 'ALL' ? (
                  <div className="text-right flex-shrink-0">
                    {getAllCountryDisplays(listing).map((p, i) => (
                      <p key={i} className="font-mono text-sm font-semibold whitespace-nowrap">
                        {p.isEstimated && (
                          <EstimatedBadge />
                        )}
                        {p.flag} {p.display}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-lg font-semibold whitespace-nowrap">
                    {getDisplayPrice(listing).isEstimated && (
                      <EstimatedBadge />
                    )}
                    {getDisplayPrice(listing).display}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[11px] text-[#5C5E70]">
                  Checked {formatCheckedAt(listing.last_checked_at)}
                </p>
                <span className={buttonClass}>
                  {buttonText}
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </>
  )
}