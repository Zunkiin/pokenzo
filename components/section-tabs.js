import Link from 'next/link'

export default function SectionTabs({ active }) {
  const tabs = [
    { href: '/', key: 'tcg', label: 'TCG Prices & Stock' },
    { href: '/pokemon-go', key: 'go', label: 'Pokémon GO Community' },
  ]

  return (
    <div className="flex gap-2 mb-4">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={
            active === tab.key
              ? 'flex-1 text-center text-xs font-semibold px-3 py-2.5 rounded-xl bg-[#E8A33D]/15 text-[#E8A33D] border border-[#E8A33D]'
              : 'flex-1 text-center text-xs font-semibold px-3 py-2.5 rounded-xl bg-[#1E2030] text-[#8A8C9C] border border-[#4A4D67] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors'
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}