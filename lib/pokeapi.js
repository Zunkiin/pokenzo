let cachedList = null

export async function getPokemonList() {
  if (cachedList) return cachedList

  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
  const data = await res.json()

  cachedList = data.results.map((p) => {
    const idMatch = p.url.match(/\/pokemon\/(\d+)\//)
    const id = idMatch ? idMatch[1] : null
    return {
      name: p.name,
      displayName: p.name.charAt(0).toUpperCase() + p.name.slice(1).replace(/-/g, ' '),
      id,
      imageUrl: id
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
        : null,
    }
  })

  return cachedList
}