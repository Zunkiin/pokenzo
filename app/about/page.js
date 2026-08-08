import Link from 'next/link'

export const metadata = {
  title: 'About | Pokenzo',
  description: 'Learn about Pokenzo — a free Pokémon TCG price comparison tool for Scandinavia, built and maintained by a solo developer.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">About Pokenzo</h1>
          <p className="text-sm text-[#8A8C9C]">
            A free Pokémon TCG price comparison tool for Scandinavia, and a home for the Pokémon GO community.
          </p>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#E8A33D]">What we do</h2>
          <p className="text-sm text-[#C7C9D9] leading-relaxed">
            Pokenzo automatically tracks prices and stock for Pokémon Trading Card Game products such as Booster Boxes, Elite Trainer Boxes, Packs, and Bundles across trusted stores in Norway, Sweden, and Denmark. Instead of checking five different shops yourself, Pokenzo checks them for you, every 30 minutes.
          </p>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#4FA8A0]">Pokémon GO Community</h2>
          <p className="text-sm text-[#C7C9D9] leading-relaxed">
            Alongside price tracking, Pokenzo hosts a community hub for Pokémon GO trainers coordinate raids, trade Pokémon, and connect with other trainers worldwide.
          </p>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#E8A33D]">Who's behind it</h2>
          <p className="text-sm text-[#C7C9D9] leading-relaxed">
            Pokenzo is built and maintained by a solo developer as an independent, fan-made project. It's not affiliated with, endorsed by, or sponsored by Nintendo, Niantic, GAME FREAK, or The Pokémon Company.
          </p>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[#4FA8A0]">Get in touch</h2>
          <p className="text-sm text-[#C7C9D9] leading-relaxed">
            Questions, feedback, or a store you'd like to see added? Reach out at{' '}
            <a href="mailto:business.pokenzo@outlook.com" className="text-[#E8A33D] hover:underline">
              business.pokenzo@outlook.com
            </a>
            , or join the community on{' '}
            <a href="https://discord.gg/hxkk9XhdwT" target="_blank" rel="noopener noreferrer" className="text-[#E8A33D] hover:underline">
              Discord
            </a>
            .
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-[#8A8C9C] pt-2">
          <Link href="/privacy" className="hover:text-[#E8A33D] transition-colors">Privacy Policy</Link>
          <span className="text-[#5C5E70]">·</span>
          <Link href="/terms" className="hover:text-[#E8A33D] transition-colors">Terms of Service</Link>
        </div>
      </div>
    </main>
  )
}