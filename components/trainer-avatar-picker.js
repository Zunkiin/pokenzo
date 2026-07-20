'use client'
import { useState } from 'react'

export default function TrainerAvatarPicker({ onSelect }) {
  const [name, setName] = useState('')
  const [checking, setChecking] = useState(false)
  const [found, setFound] = useState(null)
  const [notFound, setNotFound] = useState(false)

  async function handleCheck() {
    if (!name.trim()) return
    setChecking(true)
    setNotFound(false)

    const slug = name.trim().toLowerCase().replace(/\s+/g, '')
    const url = `https://play.pokemonshowdown.com/sprites/trainers/${slug}.png`

    const works = await new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
    })

    setChecking(false)
    if (works) {
      setFound(url)
      onSelect(url)
    } else {
      setFound(null)
      setNotFound(true)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. cynthia, hiker, ash"
          className="flex-1 px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
        />
        <button type="button" onClick={handleCheck} disabled={checking} className="text-sm font-medium px-3 py-2 rounded-lg bg-[#2A2C3D] text-[#EDEAE3]">
          {checking ? '...' : 'Check'}
        </button>
      </div>
      {found && (
        <img src={found} alt="" className="w-16 h-16 object-contain mt-2" />
      )}
      {notFound && (
        <p className="text-xs text-[#C1554A] mt-1">No trainer sprite found with that name.</p>
      )}
    </div>
  )
}