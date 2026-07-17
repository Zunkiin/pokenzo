import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 pt-4">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-[#EDEAE3] tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
          <img src="/logo.png" alt="Pokenzo" className="w-8 h-8" />
          <span>Poke<span className="text-[#E8A33D]">nzo</span></span>
        </Link>
      </div>
    </header>
  )
}