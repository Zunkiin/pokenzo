import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function PublicProfilePage({ params }) {
  const { username } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <p className="text-sm text-[#8A8C9C]">Trainer not found.</p>
      </main>
    )
  }

  const { data: offers } = await supabase
  .from('trade_offers')
  .select('*')
  .eq('user_id', profile.id)
  .eq('status', 'active')
  .order('created_at', { ascending: false })

const { count: completedCount } = await supabase
  .from('trade_offers')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', profile.id)
  .eq('status', 'completed')

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/t/pokemon-go" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D]">
          ← Back
        </Link>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h1 className="text-xl font-semibold mb-1">{profile.username}</h1>
          <p className="text-sm text-[#C7C9D9]">Trainer level: {profile.go_level || '—'}</p>
          <p className="text-sm text-[#4FA8A0] mt-1">{completedCount || 0} trades completed</p>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h2 className="text-sm font-semibold mb-3">Trade offers</h2>
          {(!offers || offers.length === 0) && (
            <p className="text-sm text-[#8A8C9C]">No active trade offers.</p>
          )}
          {offers?.map((offer) => (
            <div key={offer.id} className="text-sm bg-[#14151F] rounded-lg p-3 mb-2">
              <p>Has: <span className="text-[#E8A33D]">{offer.have_pokemon}</span></p>
              <p>Wants: <span className="text-[#4FA8A0]">{offer.want_pokemon}</span></p>
              {offer.notes && <p className="text-xs text-[#8A8C9C] mt-1">{offer.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}