import Link from 'next/link'

const categories = [
  { label: 'All', href: '/' },
  { label: 'Booster Boxes', href: '/?type=booster_box' },
  { label: 'Booster Packs', href: '/?type=single_booster' },
  { label: 'Pokémon GO', href: '/pokemon-go' },
]

export default function CategoryNav() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((cat) => (
        <Link
          key={cat.href}
          href={cat.href}
          className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#1E2030] text-[#8A8C9C] border border-[#2A2C3D] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors"
        >
          {cat.label}
        </Link>
      ))}
    </div>
  )
}