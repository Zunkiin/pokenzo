import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-8 text-center">
      <a
        href="https://buymeacoffee.com/pokenzo"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full bg-[#E8A33D]/15 text-[#E8A33D] border border-[#E8A33D] hover:bg-[#E8A33D]/25 transition-colors mb-6"
      >
        <span>☕</span>
        Buy me a coffee
      </a>
      <p className="text-xs text-[#5C5E70] leading-relaxed">
        Pokenzo is an independent, fan-made project and is not endorsed by, affiliated with, or sponsored by Nintendo, Niantic, GAME FREAK, or The Pokémon Company. All Pokémon names, images, and related trademarks belong to their respective owners. Pokenzo provides price comparisons and community tools for Pokémon fans and does not claim ownership of any Pokémon content shown on this site.
      </p>
      <div className="flex items-center justify-center gap-3 mt-3">
        <Link href="/about" className="text-xs text-[#8A8C9C] hover:text-[#E8A33D] transition-colors">
          About
        </Link>
        <span className="text-xs text-[#5C5E70]">·</span>
        <Link href="/privacy" className="text-xs text-[#8A8C9C] hover:text-[#E8A33D] transition-colors">
          Privacy Policy
        </Link>
        <span className="text-xs text-[#5C5E70]">·</span>
        <Link href="/terms" className="text-xs text-[#8A8C9C] hover:text-[#E8A33D] transition-colors">
          Terms of Service
        </Link>
      </div>
      <p className="text-xs text-[#5C5E70] mt-2">
        © {new Date().getFullYear()} Pokenzo
      </p>
    </footer>
  )
}