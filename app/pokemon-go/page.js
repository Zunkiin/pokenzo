import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Pokémon GO Hub - Host & Join Raids | Pokenzo',
  description: 'Find and join Pokémon GO raids, or host your own raid. Share your shinies, hundos and make trades with other trainers - coming soon to Pokenzo.',
}
export default function PokemonGoPage() {
  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4">
  <Link
    href="/"
    className="inline-flex items-center gap-1 text-sm text-[#8A8C9C] hover:text-[#E8A33D] transition-colors"
  >
    <ArrowLeft size={20} strokeWidth={2.5} /> Back
  </Link>
</div>
<div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto text-center py-20"></div>
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto text-center py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E8A33D] font-semibold mb-3">
          Coming soon
        </p>
        <h1 className="text-2xl font-semibold mb-3">Pokémon GO Hub</h1>
        <p className="text-sm text-[#8A8C9C] max-w-sm mx-auto">
           Soon you'll be able to host and join raids, share your shinies and hundos, and make trades with other trainers. Stay tuned!
        </p>
      </div>
    </main>
  )
}