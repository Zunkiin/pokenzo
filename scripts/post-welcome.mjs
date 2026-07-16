import 'dotenv/config'

const webhookUrl = process.env.DISCORD_WEBHOOK_URL

const message = `**Welcome to Pokenzo! 🎴**

Compare Pokémon Trading Card Game (TCG) prices and stock across Scandinavia, Pokémon Go and TCG Hub.
https://www.pokenzo.com/

**Channel rules:**
1. Be kind and respectful to other members
2. No spam or unrelated advertising
3. Alerts here are automated - feel free to ask if you have questions about a product
4. Report incorrect prices or stock status to an admin, and we'll fix it`

await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: message })
})

console.log('Message sent!')