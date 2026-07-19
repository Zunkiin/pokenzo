export default function Footer() {
  return (
    <footer className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-8 text-center">
      <p className="text-xs text-[#5C5E70] leading-relaxed">
        Pokenzo is an independent, fan-made project and is not endorsed by, affiliated with, or sponsored by Nintendo, Niantic, GAME FREAK, or The Pokémon Company. All Pokémon names, images, and related trademarks belong to their respective owners. Pokenzo provides price comparisons and community tools for Pokémon fans and does not claim ownership of any Pokémon content shown on this site.
      </p>
      <p className="text-xs text-[#5C5E70] mt-2">
        © {new Date().getFullYear()} Pokenzo
      </p>
    </footer>
  )
}