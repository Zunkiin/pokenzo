'use client'
import { useState } from 'react'
import Link from 'next/link'

const categories = [
  { label: 'All Products', type: null },
  { label: 'Booster Boxes', type: 'booster_box' },
  { label: 'Booster Packs', type: 'single_booster' },
  { label: 'Elite Trainer Boxes', type: 'etb' },
  { label: 'Booster Bundles', type: 'booster_bundle' },
  { label: 'Collection Boxes', type: 'collection_box' },
  { label: 'Tin Boxes', type: 'tin_box' },
]

const languages = [
  { label: 'All Languages', value: null },
  { label: 'Japanese', value: 'JP' },
  { label: 'English', value: 'EN' },
  { label: 'Chinese', value: 'CN' },
]

function buildHref(type, language) {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (language) params.set('language', language)
  const query = params.toString()
  return query ? '/?' + query : '/'
}

function Chevron({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={'flex-shrink-0 transition-transform ' + (open ? 'rotate-180' : '')}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function CategoryNav({ activeType, activeLanguage }) {
  const [openPanel, setOpenPanel] = useState(null) // 'category' | 'language' | null

  const activeCategoryLabel = categories.find((c) => c.type === activeType)?.label || 'All Products'
  const activeLanguageLabel = languages.find((l) => l.value === activeLanguage)?.label || 'All Languages'

  return (
    <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-3 mb-4">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setOpenPanel(openPanel === 'category' ? null : 'category')}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#14151F] border border-[#4A4D67] text-[#C7C9D9] text-xs font-semibold hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors"
          >
            <span className="truncate">{activeCategoryLabel}</span>
            <Chevron open={openPanel === 'category'} />
          </button>

          {openPanel === 'category' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenPanel(null)} />
              <div className="absolute left-0 right-0 sm:right-auto sm:min-w-[260px] top-full mt-2 z-50 bg-[#1E2030] border border-[#2A2C3D] rounded-xl p-3 shadow-xl">
                <div className="flex flex-wrap gap-2">
                  {categories.map((item) => {
                    const isActive = activeType === item.type
                    return (
                      <Link
                        key={item.label}
                        href={buildHref(item.type, activeLanguage)}
                        onClick={() => setOpenPanel(null)}
                        className={
                          isActive
                            ? 'text-xs font-semibold px-3 py-2 rounded-full border bg-[#E8A33D] text-[#14151F] border-[#E8A33D]'
                            : 'text-xs font-medium px-3 py-2 rounded-full border border-[#4A4D67] bg-[#14151F] text-[#C7C9D9] hover:border-[#E8A33D] hover:text-[#E8A33D]'
                        }
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setOpenPanel(openPanel === 'language' ? null : 'language')}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#14151F] border border-[#4A4D67] text-[#C7C9D9] text-xs font-semibold hover:border-[#4FA8A0] hover:text-[#4FA8A0] transition-colors"
          >
            <span className="truncate">{activeLanguageLabel}</span>
            <Chevron open={openPanel === 'language'} />
          </button>

          {openPanel === 'language' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenPanel(null)} />
              <div className="absolute right-0 left-auto sm:min-w-[220px] top-full mt-2 z-50 bg-[#1E2030] border border-[#2A2C3D] rounded-xl p-3 shadow-xl">
                <div className="flex flex-wrap gap-2">
                  {languages.map((item) => {
                    const isActive = activeLanguage === item.value
                    return (
                      <Link
                        key={item.label}
                        href={buildHref(activeType, item.value)}
                        onClick={() => setOpenPanel(null)}
                        className={
                          isActive
                            ? 'text-xs font-semibold px-3 py-2 rounded-full border bg-[#4FA8A0] text-[#14151F] border-[#4FA8A0]'
                            : 'text-xs font-medium px-3 py-2 rounded-full border border-[#4A4D67] bg-[#14151F] text-[#C7C9D9] hover:border-[#4FA8A0] hover:text-[#4FA8A0]'
                        }
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}