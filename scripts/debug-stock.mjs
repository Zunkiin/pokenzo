// Read-only helper: shows which stock signals a product page contains.
// Usage:  node debug-stock.mjs "https://www.maxgaming.no/no/pokemon/151c-journey-booster-box-chinese"
const url = process.argv[2]
if (!url) { console.log('Usage: node debug-stock.mjs "<url>"'); process.exit(1) }

const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept-Language': 'nb-NO,nb;q=0.9' } })
console.log('HTTP', res.status)
const html = await res.text()

console.log('\n--- meta availability tags ---')
console.log((html.match(/<meta[^>]*availability[^>]*>/gi) || []).join('\n') || '(none)')

console.log('\n--- "availability" values in JSON-LD / scripts ---')
console.log((html.match(/"availability"\s*:\s*"[^"]*"/g) || []).join('\n') || '(none)')

const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase()

console.log('\n--- out-of-stock phrases found in visible text (with context) ---')
for (const p of ['utsolgt','ikke på lager','ikke tilgjengelig','slut i lager','slutsåld','ej i lager','udsolgt','sold out','out of stock','kommer snart','lagerbeholdning: 0']) {
  let i = text.indexOf(p), n = 0
  while (i !== -1 && n < 3) { console.log(`"${p}": ...${text.slice(Math.max(0, i - 60), i + 60)}...`); i = text.indexOf(p, i + 1); n++ }
}
console.log('\n--- positive phrases ---')
for (const p of ['på lager', 'in stock', 'forhåndsbestil']) console.log(p, text.includes(p))
