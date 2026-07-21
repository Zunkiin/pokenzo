import Link from 'next/link'

const categories = [
  { label: 'All', type: null },
  { label: 'Booster Boxes', type: 'booster_box' },
  { label: 'Booster Packs', type: 'single_booster' },
  { label: 'Elite Trainer Boxes', type: 'etb' },
  { label: 'Booster Bundles', type: 'booster_bundle' },
]

const languages = [
  { label: 'All Languages', value: null },
  { label: 'Japanese', value: 'JP' },
  { label: 'English', value: 'EN' },
]

function buildHref(type, language) {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (language) params.set('language', language)
  const query = params.toString()
  return query ? '/?' + query : '/'
}

export default function CategoryNav({ activeType, activeLanguage }) {
  return (
    <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-3">
      <div className="flex flex-wrap gap-2 pb-1">
        {categories.map((cat) => {
          const isActive = activeType === cat.type
          const className = isActive
            ? 'flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#E8A33D] text-[#14151F] border border-[#E8A33D]'
            : 'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#14151F] text-[#C7C9D9] border border-[#4A4D67] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors'

          return (
            <Link key={cat.label} href={buildHref(cat.type, activeLanguage)} className={className}>
              {cat.label}
            </Link>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 pb-1 mt-2 pt-2 border-t border-[#2A2C3D]">
        {languages.map((lang) => {
          const isActive = activeLanguage === lang.value
          const className = isActive
            ? 'flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#4FA8A0] text-[#14151F] border border-[#4FA8A0]'
            : 'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#14151F] text-[#C7C9D9] border border-[#4A4D67] hover:border-[#4FA8A0] hover:text-[#4FA8A0] transition-colors'

          return (
            <Link key={lang.label} href={buildHref(activeType, lang.value)} className={className}>
              {lang.label}
            </Link>
          )
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-[#2A2C3D]">
        <Link
          href="/pokemon-go"
          className="inline-block text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap bg-[#14151F] text-[#4FA8A0] border border-[#4FA8A0]/50 hover:border-[#4FA8A0] transition-colors"
        >
          Pokémon GO
        </Link>
      </div>
    </div>
  )
}