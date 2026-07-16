import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const OUT_OF_STOCK_PHRASES = [
  'utsolgt', 'ikke på lager', 'ikke tilgjengelig',
  'slut i lager', 'slutsåld', 'ej i lager',
  'udsolgt', 'sold out', 'out of stock',
  'kommer snart', 'coming soon', 'lagerbeholdning: 0'
]

const END_MARKERS = [
  'anbefalte produkter', 'du liker kanskje også', 'related products',
  'andre kunder ser også på', 'anbefalte tilbehør', 'anbefalt tilbehør', 'siste sett'
]

function parsePriceString(raw) {
  let cleaned = raw.replace(/[^\d.,]/g, '')
  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')
  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    cleaned = cleaned.replace(/,/g, '')
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
  const match = text.match(/(\d[\d\s]{1,6}(?:[.,]\d{2})?)\s?(?:kr|nok|sek|dkk)/i)
  return match ? parseFloat(match[1].replace(/\s/g, '').replace(',', '.')) : null
}

function extractMetaPrice(html) {
  const metaMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:og:price:amount|product:price:amount)["'][^>]*>/i)
  if (!metaMatch) return null
  const contentMatch = metaMatch[0].match(/content=["']([\d.,]+)["']/i)
  if (!contentMatch) return null
  return parsePriceString(contentMatch[1])
}

function extractWooCommercePrice(html) {
  const regex = /woocommerce-Price-amount amount["'][^>]*>\s*<bdi>\s*([\d.,\s]+)/gi
  let match
  while ((match = regex.exec(html)) !== null) {
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
    const value = contentMatch[1].toLowerCase()
    if (value.includes('instock') || value.includes('in stock')) return true
    if (value.includes('outofstock') || value.includes('out of stock')) return false
  }
  return null
}

async function sendDiscordAlert(message) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
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
    .select('id, product_url, currency, current_price, in_stock, products(name), stores(name)')

  if (error) {
    console.error('Klarte ikke hente listings:', error.message)
    process.exit(1)
  }

  for (const listing of listings) {
    try {
      const res = await fetch(listing.product_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PokenzoBot/1.0)' }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const html = await res.text()
      const productName = listing.products?.name ?? 'Ukjent produkt'
      const storeName = listing.stores?.name ?? 'Ukjent butikk'

      const fullText = stripHtml(html).toLowerCase()
      const relevantText = getRelevantSection(fullText, productName)
      const cleanedText = relevantText.replace(/salg\s+utsolgt/gi, '')

      const metaAvailability = extractMetaAvailability(html)
      const newInStock = metaAvailability !== null
        ? metaAvailability
        : !OUT_OF_STOCK_PHRASES.some(p => cleanedText.includes(p))

      const metaPrice = extractMetaPrice(html) ?? extractWooCommercePrice(html)
      let newPrice = listing.current_price
      if (metaPrice !== null) {
        newPrice = metaPrice
      } else {
        const fallbackPrice = extractPrice(relevantText)
        if (fallbackPrice !== null && listing.current_price) {
          const percentChange = Math.abs(fallbackPrice - listing.current_price) / listing.current_price
          if (percentChange > 0.7) {
            console.warn(`Mistenkelig prisendring for ${storeName} - ${productName}: ${listing.current_price} → ${fallbackPrice}. Beholder gammel pris.`)
          } else {
            newPrice = fallbackPrice
          }
        } else if (fallbackPrice !== null) {
          newPrice = fallbackPrice
        }
      }

      console.log(`[${storeName}] ${productName}: ${newInStock ? 'PÅ LAGER' : 'utsolgt'} - ${newPrice} ${listing.currency}`)

      await supabase.from('price_history').insert({
        listing_id: listing.id,
        price: newPrice,
        in_stock: newInStock
      })

      if (!listing.in_stock && newInStock) {
        await sendDiscordAlert(`🟢 **${productName}** (${storeName}) er tilbake på lager! ${newPrice} ${listing.currency}\n${listing.product_url}`)
      }
      if (listing.in_stock && !newInStock) {
        await sendDiscordAlert(`🔴 **${productName}** (${storeName}) er nå utsolgt.`)
      }
      if (listing.current_price && newPrice < listing.current_price) {
        await sendDiscordAlert(`💰 Prisfall på **${productName}** (${storeName}): ${listing.current_price} → ${newPrice} ${listing.currency}\n${listing.product_url}`)
      }

      await supabase
        .from('listings')
        .update({
          current_price: newPrice,
          in_stock: newInStock,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', listing.id)

    } catch (err) {
      console.error(`Feil ved sjekk av listing ${listing.id}:`, err.message)
    }
  }
}

main()