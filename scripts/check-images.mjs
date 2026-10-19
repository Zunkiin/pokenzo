// Sjekker at bildet til hvert produkt faktisk laster.
// Bruk:  node scripts/check-images.mjs
// Bare leser fra databasen. Skriver ingenting, endrer ingenting.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CONCURRENCY = 6
const TIMEOUT_MS = 15000
const SITE = 'https://www.pokenzo.com'

async function loadProducts() {
  const all = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('products')
      .select('slug, name, image_url')
      .order('slug')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    all.push(...data)
    if (data.length < pageSize) break
  }
  return all
}

async function checkImage(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Samme oppførsel som en nettleser på pokenzo.com (noen butikker blokkerer andre)
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Referer: SITE + '/',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    })
    const type = (res.headers.get('content-type') || '').toLowerCase()
    // Les bare litt for å vite at det kommer innhold
    const buf = res.body ? await res.arrayBuffer() : new ArrayBuffer(0)
    controller.abort()
    if (!res.ok) return `HTTP ${res.status}`
    if (!type.startsWith('image/')) return `Ikke et bilde (${type || 'ukjent type'})`
    if (buf.byteLength < 500) return `Tomt/for lite (${buf.byteLength} bytes)`
    return null
  } catch (e) {
    const cause = e.cause ? ` (${e.cause.code || e.cause.message})` : ''
    return e.name === 'AbortError' ? 'Timeout' : `Feil: ${e.message}${cause}`
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const products = await loadProducts()
  console.log(`Sjekker bildene til ${products.length} produkter...\n`)

  const problems = []
  let index = 0
  let done = 0

  async function worker() {
    while (index < products.length) {
      const p = products[index++]
      let problem
      if (!p.image_url || !p.image_url.trim()) problem = 'Mangler image_url'
      else problem = await checkImage(p.image_url.trim())
      if (problem) problems.push({ ...p, problem })
      done++
      if (done % 25 === 0) console.log(`  ${done}/${products.length}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  problems.sort((a, b) => a.slug.localeCompare(b.slug))
  console.log('')
  if (problems.length === 0) {
    console.log('Alle bilder lastet fint.')
    return
  }
  console.log(`${problems.length} produkt(er) med bilde som ikke virker:\n`)
  for (const p of problems) {
    console.log(`- ${p.name}`)
    console.log(`    ${p.problem}`)
    console.log(`    Side:  ${SITE}/product/${p.slug}`)
    console.log(`    Bilde: ${p.image_url || '(ingen)'}`)
  }
  console.log('\nTips: en feil her kan av og til skyldes at butikken blokkerer skript.')
  console.log('Åpne bilde-lenken i nettleseren for å bekrefte før du bytter det.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
