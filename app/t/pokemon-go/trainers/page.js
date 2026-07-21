import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PokemonGoNav from '@/components/pokemon-go-nav'
import CommunityNav from '@/components/community-nav'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TrainersPage() {
  const { data: trainers } = await supabase
    .from('profiles')
    .select('username, go_level, avatar_trainer_url')
    .order('username', { ascending: true })

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-4">
        <Link href="/t/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          <span className="inline-flex items-center gap-1"><ArrowLeft size={16} strokeWidth={2.5} /> Back</span>
        </Link>

        <h1 className="text-xl font-semibold">Trainers</h1>
        <PokemonGoNav />
        <CommunityNav />

        <div className="space-y-2">
          {(!trainers || trainers.length === 0) && (
            <p className="text-sm text-[#8A8C9C]">No trainers yet.</p>
          )}
          {trainers?.map((trainer) => (
            <Link
              key={trainer.username}
              href={`/t/pokemon-go/${trainer.username}`}
              className="flex items-center justify-between rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 hover:border-[#E8A33D] transition-colors"
            >
              <div className="flex items-center gap-2">
                {trainer.avatar_trainer_url && (
                  <img src={trainer.avatar_trainer_url} alt="" className="w-8 h-8 object-contain" />
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