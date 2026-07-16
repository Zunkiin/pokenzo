import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const OUT_OF_STOCK_PHRASES = [
  'utsolgt', 'ikke på lager', 'ikke tilgjengelig',
  'slut i lager', 'slutsåld', 'ej i lager',
  'udsolgt', 'sold out', 'out of stock'
]

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractPrice(text) {
  const match = text.match(/(\d[\d\s]{1,6}(?:[.,]\d{2})?)\s?(?:kr|nok|sek|dkk)/i)
  return match ? parseFloat(match[1].replace(/\s/g, '').replace(',', '.')) : null
}

function extractMetaPrice(html) {
  const metaMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:og:price:amount|product:price:amount)["'][^>]*>/i)
  if (!metaMatch) return null
  const contentMatch = metaMatch[0].match(/content=["']([\d.]+)["']/i)
  if (!contentMatch) return null
  const value = parseFloat(contentMatch[1])
  return isNaN(value) ? null : value
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
      const text = stripHtml(html).toLowerCase()
      const newInStock = !OUT_OF_STOCK_PHRASES.some(p => text.includes(p))
      const metaPrice = extractMetaPrice(html)
      const newPrice = metaPrice ?? extractPrice(text) ?? listing.current_price
      const productName = listing.products?.name ?? 'Ukjent produkt'
      const storeName = listing.stores?.name ?? 'Ukjent butikk'
      

      

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