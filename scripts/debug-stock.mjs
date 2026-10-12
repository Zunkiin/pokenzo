// Read-only helper: shows which stock signals a product page contains,
// and what the scraper's "relevant section" would contain.
// Usage:  node scripts/debug-stock.mjs "<url>" "<product name as in Pokenzo>"
// Example: node scripts/debug-stock.mjs "https://pokestore.no/products/pokemon-30th-celebration-elite-trainer-box" "30th Celebration Elite Trainer Box"
const url = process.argv[2]
const productName = process.argv[3] || ''
if (!url) { console.log('Usage: node scripts/debug-stock.mjs "<url>" "<product name>"'); process.exit(1) }

const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept-Language': 'nb-NO,nb;q=0.9' } })
console.log('HTTP', res.status)
const html = await res.text()

console.log('\n--- meta availability tags ---')
console.log((html.match(/<meta[^>]*availability[^>]*>/gi) || []).join('\n') || '(none)')
console.log('\n--- "availability" values ---')
console.log((html.match(/"availability"\s*:\s*"[^"]*"/g) || []).join('\n') || '(none)')

const full = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase()

const END_MARKERS = ['anbefalte produkter','du liker kanskje også','related products','andre kunder ser også på','anbefalte tilbehør','anbefalt tilbehør','siste sett','faq','you may also like','you might also like','frequently asked','andre købte','andre så også på','kunder som købte','andre forslag til deg']
let text = full
if (productName) {
  const words = productName.toLowerCase().split(' ').filter(w => w.length > 3)
  const phrase = words.slice(0, 2).join(' ')
  const idx = text.indexOf(phrase)
  console.log(`\n--- relevant section ---\nsearch phrase: "${phrase}", first found at char ${idx} of ${full.length}`)
  if (idx !== -1) text = text.slice(idx)
}
let cut = text.length, cutBy = '(none)'
for (const m of END_MARKERS) { const i = text.indexOf(m); if (i !== -1 && i < cut) { cut = i; cutBy = m } }
const relevant = text.slice(0, cut)
console.log(`slice length ${relevant.length}, cut by end marker: ${cutBy}`)

const show = (label, phrases, src) => {
  console.log(`\n--- ${label} ---`)
  for (const p of phrases) {
    const i = src.indexOf(p)
    console.log(`"${p}": ${i === -1 ? 'not found' : '...' + src.slice(Math.max(0, i - 60), i + 80) + '...'}`)
  }
}
const OOS = ['utsolgt','ikke på lager','ikke tilgjengelig','slut i lager','slutsåld','ej i lager','udsolgt','sold out','out of stock','kommer snart','lagerbeholdning: 0']
const PRE = ['forhåndsbestil','forhåndbestil','forudbestil','förbeställ','förhandsboka','förboka']
show('OUT-OF-STOCK phrases in the SLICE the scraper reads', OOS, relevant)
show('PRE-ORDER phrases in the SLICE the scraper reads', PRE, relevant)
show('PRE-ORDER phrases in the WHOLE page (for comparison)', PRE, full)
