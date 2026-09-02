import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Set DRY_RUN=true to log what the bot WOULD do (alerts, price/stock
// updates) without actually sending Discord messages or writing to the
// database - safe way to test a change before it runs for real.
const DRY_RUN = process.env.DRY_RUN === 'true'
if (DRY_RUN) {
  console.log('=== DRY RUN MODE: no Discord alerts will be sent, no database writes will happen ===')
}

// Set STORE_FILTER=StoreName to only check listings from that one store -
// useful for quickly testing a single newly-added store without waiting
// for every other listing to be checked first.
const STORE_FILTER = process.env.STORE_FILTER || null
if (STORE_FILTER) {
  console.log(`=== STORE FILTER: only checking listings from "${STORE_FILTER}" ===`)
}

const OUT_OF_STOCK_PHRASES = [
  'utsolgt', 'ikke på lager', 'ikke tilgjengelig',
  'slut i lager', 'slutsåld', 'ej i lager',
  'udsolgt', 'sold out', 'out of stock',
  'kommer snart', 'lagerbeholdning: 0'
]

// Some stores' product pages contain stock text for MORE than one variant
// at once in the raw HTML (e.g. Rogerz shows both "Out of stock" and "in
// stock, ready to be shipped" for two different price variants on the same
// page). For those specific stores only, a strong positive phrase takes
// priority over an OUT_OF_STOCK_PHRASES match. Scoped per-store (not
// global) so it can't accidentally affect other stores' detection.
// Stores whose stock text is known to be unreliable in raw HTML (e.g. it
// only updates via client-side JavaScript we never run), with no positive
// signal to fall back on either. Skip automatic stock-status changes for
// these until a more reliable method (like a store JSON endpoint) is built.
const SKIP_STOCK_UPDATES_FOR_STORES = ['Pokelageret']

// Stores whose availability meta tag has proven unreliable (doesn't match
// the actual visible stock text on the page). For these, skip the meta
// tag and rely purely on the OUT_OF_STOCK_PHRASES text check instead.
const SKIP_META_AVAILABILITY_FOR_STORES = []

const IN_STOCK_OVERRIDE_BY_STORE = {
  Rogerz: ['på lager', 'ready to be shipped', 'klar til afsendelse'],
}

// Some stores show prices for multiple variants on the same page (Rogerz
// shows both "Alm. moms" and "Brugtmoms" VAT-scheme variants). For those
// stores, extract the specific variant's price by name instead of relying
// on whichever price happens to appear first in the text.
const PRICE_OVERRIDE_BY_STORE = {
  Rogerz: (text) => {
    const match = text.match(/alm\.?\s*moms\s*-?\s*([\d.,]+)/i)
    return match ? parsePriceString(match[1]) : null
  },
}

// Stores whose stock status has proven to flip-flop rapidly - these get
// the extra "confirm on two consecutive checks" treatment before alerting,
// while all other stores alert immediately as before.
const VOLATILE_STORES = ['Pokemons']

const END_MARKERS = [
  'anbefalte produkter', 'du liker kanskje også', 'related products',
  'andre kunder ser også på', 'anbefalte tilbehør', 'anbefalt tilbehør', 'siste sett',
  'faq', 'you may also like', 'you might also like', 'frequently asked',
  'andre købte', 'andre så også på', 'kunder som købte', 'andre forslag til deg'
]

function parsePriceString(raw) {
  let cleaned = raw.replace(/[^\d.,]/g, '')
  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')

  if (lastComma !== -1 && lastDot !== -1) {
    // Both separators present: whichever comes last is the real decimal separator.
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (lastComma !== -1 || lastDot !== -1) {
    // Only one type of separator present. If it's followed by exactly 3
    // digits, it's almost certainly a thousands separator (e.g. "2,299"
    // or "2.299" meaning 2299) - real prices essentially never have 3
    // decimal places, whether the separator is a comma or a period.
    const sepIndex = lastComma !== -1 ? lastComma : lastDot
    const digitsAfter = cleaned.length - sepIndex - 1
    if (digitsAfter === 3) {
      cleaned = cleaned.replace(/[.,]/g, '')
    } else {
      cleaned = cleaned.replace(',', '.')
    }
  }

  const value = parseFloat(cleaned)
  return isNaN(value) ? null : value
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getRelevantSection(fullText, productName) {
  let text = fullText

  if (productName) {
  const words = productName.toLowerCase().split(' ').filter(w => w.length > 3)
  const searchPhrase = words.slice(0, 2).join(' ')
  const nameIdx = text.indexOf(searchPhrase)
  if (nameIdx !== -1) {
    text = text.slice(nameIdx)
  }
}

  let cutIndex = text.length
  for (const marker of END_MARKERS) {
    const idx = text.indexOf(marker)
    if (idx !== -1 && idx < cutIndex) cutIndex = idx
  }
  return text.slice(0, cutIndex)
}

function extractPrice(text) {
  // Exclude numbers immediately preceded by "over" - almost always a
  // shipping-threshold phrase (e.g. "fri frakt over 300kr"), not the
  // actual product price.
  const match = text.match(/(?<!over\s)(\d[\d\s.,]{0,8})\s?(?:kr|nok|sek|dkk)/i)
  return match ? parsePriceString(match[1]) : null
}

function extractMetaPrice(html) {
  const metaMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:og:price:amount|product:price:amount)["'][^>]*>/i)
  if (!metaMatch) return null
  const contentMatch = metaMatch[0].match(/content=["']([\d.,\s]+)["']/i)
  if (!contentMatch) return null
  return parsePriceString(contentMatch[1])
}

function extractWooCommercePrice(html, productName) {
  const bodyIndex = html.search(/<body/i)
  let searchArea = bodyIndex !== -1 ? html.slice(bodyIndex) : html

  if (productName) {
    const words = productName.toLowerCase().split(' ').filter(w => w.length > 3)
    const searchPhrase = words.slice(0, 2).join(' ')
    const lowerArea = searchArea.toLowerCase()
    const nameIdx = lowerArea.indexOf(searchPhrase)
    if (nameIdx !== -1) {
      searchArea = searchArea.slice(nameIdx)
    }
  }

  const regex = /woocommerce-Price-amount amount["'][^>]*>\s*<bdi>\s*([\d.,\s]+)/gi
  let match
  while ((match = regex.exec(searchArea)) !== null) {
    const value = parsePriceString(match[1])
    if (value !== null && value > 0) return value
  }
  return null
}

function extractMetaAvailability(html) {
  const metaTags = html.match(/<meta[^>]*>/gi) || []
  for (const tag of metaTags) {
    const isAvailabilityTag = /(?:property|name)=["'](?:og:availability|product:availability)["']/i.test(tag)
    if (!isAvailabilityTag) continue
    const contentMatch = tag.match(/content=["']([^"']+)["']/i)
    if (!contentMatch) continue
    const value = contentMatch[1].toLowerCase().trim()
    if (value === 'oos') return false
    if (value.includes('instock') || value.includes('in stock')) return true
    if (value.includes('outofstock') || value.includes('out of stock')) return false
  }
  return null
}

// Many stores embed structured Schema.org product data (JSON-LD) for SEO,
// containing an explicit, machine-readable availability field. Since our
// stripHtml() removes <script> tags entirely, this data would otherwise
// be discarded before we ever see it. Checked before falling back to
// meta tags or fragile visible-text matching. Wrapped defensively - any
// parsing failure just falls through to the existing detection methods.
function extractJsonLdAvailability(html) {
  const scriptBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of scriptBlocks) {
    const jsonMatch = block.match(/>([\s\S]*?)<\/script>/i)
    if (!jsonMatch) continue
    try {
      const data = JSON.parse(jsonMatch[1])
      const candidates = Array.isArray(data) ? data : [data, ...(data['@graph'] || [])]
      for (const item of candidates) {
        const offers = item?.offers
        const availability = (Array.isArray(offers) ? offers[0]?.availability : offers?.availability) ?? item?.availability
        if (typeof availability === 'string') {
          if (availability.includes('InStock')) return true
          if (availability.includes('OutOfStock')) return false
        }
      }
    } catch (e) {
      // Malformed or unexpected JSON-LD - ignore and fall through.
    }
  }
  return null
}

async function sendDiscordAlert(message, country) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would send Discord alert to ${country || 'fallback'}:\n${message}`)
    return
  }
  // Route each alert to the Discord channel matching the store's country,
  // so #alerts channels can be split per country instead of one shared feed.
  const webhookMap = {
    NO: process.env.DISCORD_WEBHOOK_URL_NO,
    SE: process.env.DISCORD_WEBHOOK_URL_SE,
    DK: process.env.DISCORD_WEBHOOK_URL_DK,
  }
  const webhookUrl = webhookMap[country] || process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  })
}

async function main() {
  const { data: listings, error } = await supabase
  .from('listings')
  .select('id, product_url, currency, current_price, in_stock, pending_in_stock, products(name, slug), stores(name, country)')

  if (error) {
    console.error('Failed to fetch listings:', error.message)
    process.exit(1)
  }

  const listingsToCheck = STORE_FILTER
    ? listings.filter((l) => l.stores?.name === STORE_FILTER)
    : listings

  for (const listing of listingsToCheck) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
      let res
      try {
        res = await fetch(listing.product_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'nb-NO,nb;q=0.9,en-US;q=0.8,en;q=0.7'
          },
          signal: controller.signal
        })
      } finally {
        clearTimeout(timeoutId)
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const html = await res.text()
      const productName = listing.products?.name ?? 'Ukjent produkt'
      const storeName = listing.stores?.name ?? 'Ukjent butikk'
      const countryFlag = getCountryFlag(listing.stores?.country)
      const storeLabel = countryFlag ? `${countryFlag} ${storeName}` : storeName

      const fullText = stripHtml(html).toLowerCase()
      const relevantText = getRelevantSection(fullText, productName)
      const cleanedText = relevantText.replace(/salg\s+utsolgt/gi, '')

      const overridePhrases = IN_STOCK_OVERRIDE_BY_STORE[storeName]
      let newInStock
      if (SKIP_META_AVAILABILITY_FOR_STORES.includes(storeName)) {
        // Meta tag is unreliable for this store - rely purely on the
        // visible text, which has been confirmed accurate.
        newInStock = !OUT_OF_STOCK_PHRASES.some(p => cleanedText.includes(p))
      } else if (overridePhrases) {
        // This store's availability meta tag can be unreliable (it may only
        // reflect one of several variants on the page), so skip it entirely
        // and rely on text detection, where a strong positive phrase wins.
        const hasPositiveStockSignal = overridePhrases.some((p) => cleanedText.includes(p))
        newInStock = hasPositiveStockSignal ? true : !OUT_OF_STOCK_PHRASES.some(p => cleanedText.includes(p))
      } else {
        const metaAvailability = extractMetaAvailability(html)
        const jsonLdAvailability = metaAvailability !== null ? null : extractJsonLdAvailability(html)
        newInStock = metaAvailability !== null
          ? metaAvailability
          : jsonLdAvailability !== null
            ? jsonLdAvailability
            : !OUT_OF_STOCK_PHRASES.some(p => cleanedText.includes(p))
      }

      const priceOverrideFn = PRICE_OVERRIDE_BY_STORE[storeName]
      const overridePrice = priceOverrideFn ? priceOverrideFn(cleanedText) : null
      const metaPrice = extractWooCommercePrice(html, productName) ?? extractMetaPrice(html)
      const candidatePrice = overridePrice !== null ? overridePrice : (metaPrice !== null ? metaPrice : extractPrice(relevantText))
      let newPrice = listing.current_price

      if (candidatePrice !== null) {
        if (listing.current_price) {
          const percentChange = Math.abs(candidatePrice - listing.current_price) / listing.current_price
          if (percentChange > 0.7) {
            console.warn(`Suspicious price change for ${storeName} - ${productName}: ${listing.current_price} → ${candidatePrice}. Keeping old price.`)
          } else {
            newPrice = candidatePrice
          }
        } else {
          newPrice = candidatePrice
        }
      }

      function getCountryFlag(country) {
      const flags = { NO: '🇳🇴', SE: '🇸🇪', DK: '🇩🇰' }
      return flags[country] || ''
    }

      console.log(`[${storeName}] ${productName}: ${newInStock ? 'IN STOCK' : 'out of stock'} - ${newPrice} ${listing.currency}`)

      // Always record what we actually observed, even if it's not yet
      // "confirmed" - price_history should reflect raw reality.
      if (!DRY_RUN) {
        await supabase.from('price_history').insert({
          listing_id: listing.id,
          price: newPrice,
          in_stock: newInStock
        })
      }

      const pokenzoUrl = `https://www.pokenzo.com/product/${listing.products?.slug}`
      const listingCountry = listing.stores?.country

      let confirmedInStock = newInStock
      let pendingInStock = null

      if (SKIP_STOCK_UPDATES_FOR_STORES.includes(storeName)) {
        // Don't trust automatic stock detection for this store yet - keep
        // whatever status is already in the database untouched.
        confirmedInStock = listing.in_stock
      } else if (VOLATILE_STORES.includes(storeName)) {
        // Only treat a stock-status change as real once it's been seen on
        // two consecutive checks in a row - filters out fast flip-flops
        // without ever hiding a change that actually sticks around.
        confirmedInStock = listing.in_stock
        pendingInStock = listing.pending_in_stock

        if (newInStock === listing.in_stock) {
          if (listing.pending_in_stock !== null) pendingInStock = null
        } else if (listing.pending_in_stock === newInStock) {
          confirmedInStock = newInStock
          pendingInStock = null
          if (newInStock) {
            await sendDiscordAlert(`🟢 **${productName}** (${storeLabel}) is back in stock! ${newPrice} ${listing.currency}\n${pokenzoUrl}`, listingCountry)
          } else {
            await sendDiscordAlert(`🔴 **${productName}** (${storeLabel}) is now out of stock.\n${pokenzoUrl}`, listingCountry)
          }
        } else {
          pendingInStock = newInStock
        }
      } else {
        // Normal stores: alert immediately on any change, as before.
        if (!listing.in_stock && newInStock) {
          await sendDiscordAlert(`🟢 **${productName}** (${storeLabel}) is back in stock! ${newPrice} ${listing.currency}\n${pokenzoUrl}`, listingCountry)
        }
        if (listing.in_stock && !newInStock) {
          await sendDiscordAlert(`🔴 **${productName}** (${storeLabel}) is now out of stock.\n${pokenzoUrl}`, listingCountry)
        }
      }

      if (listing.current_price && newPrice < listing.current_price) {
        await sendDiscordAlert(`💰 Price drop on **${productName}** (${storeLabel}): ${listing.current_price} → ${newPrice} ${listing.currency}\n${pokenzoUrl}`, listingCountry)
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would update listing ${listing.id}: current_price=${newPrice}, in_stock=${confirmedInStock}, pending_in_stock=${pendingInStock}`)
      } else {
        await supabase
          .from('listings')
          .update({
            current_price: newPrice,
            in_stock: confirmedInStock,
            pending_in_stock: pendingInStock,
            last_checked_at: new Date().toISOString()
          })
          .eq('id', listing.id)
      }

    } catch (err) {
      console.error(`Error checking listing ${listing.id}:`, err.message)
    }
  }
}

main()
