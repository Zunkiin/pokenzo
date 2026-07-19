'use client'
import { useState, useEffect } from 'react'
import { getPokemonList } from '@/lib/pokeapi'

export default function PokemonPicker({ onSelect, placeholder }) {
  const [pokemonList, setPokemonList] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [isShiny, setIsShiny] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    getPokemonList().then(setPokemonList)
  }, [])

  const searchLower = search.toLowerCase()
  const mentionsShiny = searchLower.includes('shiny')
  const cleanedSearch = searchLower.replace(/shiny/g, '').trim()

  const filtered = pokemonList.filter((p) => {
    const normalizedName = p.name.replace(/-/g, '')
    const searchTerms = cleanedSearch.split(/\s+/).filter(Boolean)
    if (searchTerms.length === 0) return false
    return searchTerms.every((term) => normalizedName.includes(term.replace(/-/g, '')))
  }).slice(0, 8)

  function notify(pokemon, shiny) {
    onSelect({ name: pokemon.displayName, imageUrl: pokemon.imageUrl, shinyImageUrl: pokemon.shinyImageUrl, shiny })
  }

  function handlePick(p) {
    setSelected(p)
    setSearch(p.displayName)
    setShowDropdown(false)
    setImageFailed(false)
    setIsShiny(mentionsShiny)
    notify(p, mentionsShiny)
  }

  function handleShinyToggle(checked) {
    setIsShiny(checked)
    setImageFailed(false)
    if (selected) notify(selected, checked)
  }

  const currentImage = selected ? (isShiny ? selected.shinyImageUrl : selected.imageUrl) : null

  return (
    <div className="relative">
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDropdown(true) }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder || 'Search for a Pokémon...'}
        className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
      />

      {selected && (
        <div className="mt-2 bg-[#14151F] border border-[#2A2C3D] rounded-lg p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {currentImage && !imageFailed && (
                <img
                  key={currentImage}
                  src={currentImage}
                  alt={selected.displayName}
                  className="w-10 h-10 object-contain"
                  onError={() => setImageFailed(true)}
                />
              )}
              <span className="text-sm">{selected.displayName}</span>
            </div>
            <label className="flex items-center gap-1 text-xs text-[#C7C9D9]">
              <input type="checkbox" checked={isShiny} onChange={(e) => handleShinyToggle(e.target.checked)} className="accent-[#E8A33D]" />
              ✨ Shiny
            </label>
          </div>
          {isShiny && imageFailed && (
            <p className="text-[10px] text-[#8A8C9C] mt-1">No shiny artwork found, but it will still be marked as shiny.</p>
          )}
        </div>
      )}

      {showDropdown && search && !selected && (
        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#2A2C3D] bg-[#1E2030] shadow-lg">
          {filtered.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handlePick(p)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[#2A2C3D] text-sm"
            >
              <img src={p.imageUrl} alt={p.displayName} className="w-6 h-6 object-contain" onError={(e) => e.target.style.display = 'none'} />
              {p.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}