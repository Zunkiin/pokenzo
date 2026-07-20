'use client'
import { useState } from 'react'

const POPULAR_TRAINERS = [
  'ash', 'misty', 'brock', 'red', 'blue', 'green', 'gold', 'ethan',
  'cynthia', 'lance', 'giovanni', 'archer', 'blaine', 'erika', 'sabrina',
  'lorelei', 'agatha', 'bruno', 'oak', 'elm', 'birch', 'rowan',
  'lillie', 'hau', 'gladion', 'guzma', 'lusamine',
  'serena', 'clemont', 'korrina', 'diantha',
  'hilda', 'hilbert', 'cheren', 'bianca', 'n', 'ghetsis',
  'gloria', 'hop', 'bede', 'marnie', 'leon', 'raihan',
  'nemona', 'arven', 'penny', 'geeta', 'iono',
  'brendan', 'may', 'wally', 'steven',
  'lucas', 'dawn', 'barry', 'cyrus',
  'hiker', 'fisherman', 'gentleman', 'beauty', 'backpacker', 'artist', 'blackbelt',
]

function toDisplayName(slug) {
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export default function TrainerAvatarPicker({ onSelect }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = POPULAR_TRAINERS.filter((slug) =>
    slug.includes(search.toLowerCase())
  )

  function handlePick(slug) {
    setSelected(slug)
    setSearch(toDisplayName(slug))
    setShowDropdown(false)
    onSelect(`https://play.pokemonshowdown.com/sprites/trainers/${slug}.png`)
  }

  return (
    <div className="relative">
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDropdown(true) }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Search for a trainer..."
        className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
      />

      {selected && (
        <div className="flex items-center gap-2 mt-2 bg-[#14151F] border border-[#2A2C3D] rounded-lg p-2">
          <img
            src={`https://play.pokemonshowdown.com/sprites/trainers/${selected}.png`}
            alt=""
            className="w-12 h-12 object-contain"
            onError={(e) => e.target.style.display = 'none'}
          />
          <span className="text-sm">{toDisplayName(selected)}</span>
        </div>
      )}

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#2A2C3D] bg-[#1E2030] shadow-lg">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-[#8A8C9C]">No matches.</p>
          )}
          {filtered.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => handlePick(slug)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[#2A2C3D] text-sm"
            >
              <img
                src={`https://play.pokemonshowdown.com/sprites/trainers/${slug}.png`}
                alt=""
                className="w-8 h-8 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
              {toDisplayName(slug)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}