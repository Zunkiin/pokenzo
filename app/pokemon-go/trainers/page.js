'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'
import CommunityNav from '@/components/community-nav'
import { ArrowLeft } from 'lucide-react'

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabaseClient
        .from('profiles')
        .select('username, go_level, avatar_trainer_url, avatar_pokemon_url')
      setTrainers(shuffleArray(data || []))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
        <p className="text-sm text-[#8A8C9C]">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-4">
        <Link href="/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back</span>
        </Link>

        <h1 className="text-xl font-semibold">Trainers</h1>
        <PokemonGoNav />
        <CommunityNav />

        <div className="space-y-2">
          {trainers.length === 0 && (
            <p className="text-sm text-[#8A8C9C]">No trainers yet.</p>
          )}
          {trainers.map((trainer) => (
            <Link
              key={trainer.username}
              href={`/pokemon-go/${trainer.username}`}
              className="flex items-center justify-between rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors"
            >
              <div className="flex items-center gap-2">
                {(trainer.avatar_trainer_url || trainer.avatar_pokemon_url) && (
                  <div className="flex items-end -space-x-1">
                    {trainer.avatar_trainer_url && (
                      <img src={trainer.avatar_trainer_url} alt="" className="w-8 h-8 object-contain" />
                    )}
                    {trainer.avatar_pokemon_url && (
                      <img src={trainer.avatar_pokemon_url} alt="" className="w-6 h-6 object-contain" />
                    )}
                  </div>
                )}
                <span className="font-medium">{trainer.username}</span>
              </div>
              <span className="text-xs text-[#8A8C9C]">Level {trainer.go_level || '—'}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}