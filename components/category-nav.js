import Link from 'next/link'

const categories = [
  { label: 'All', href: '/', type: null },
  { label: 'Booster Boxes', href: '/?type=booster_box', type: 'booster_box' },
  { label: 'Booster Packs', href: '/?type=single_booster', type: 'single_booster' },
  { label: 'Elite Trainer Boxes', href: '/?type=etb', type: 'etb' },
  { label: 'Booster Bundles', href: '/?type=booster_bundle', type: 'booster_bundle' },
]

export default function CategoryNav({ activeType }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((cat) => {
        const isActive = activeType === cat.type

        const className = isActive
          ? 'flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#E8A33D] text-[#14151F] border border-[#E8A33D]'
          : 'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#1E2030] text-[#C7C9D9] border border-[#4A4D67] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors'

        return (
          <Link key={cat.href} href={cat.href} className={className}>
            {cat.label}
          </Link>
        )
      })}
    </div>
  )
}