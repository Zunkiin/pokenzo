'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Feed', href: '/pokemon-go/community-chat' },
  { label: 'Trainers', href: '/pokemon-go/trainers' },
]

export default function CommunityNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-2 mb-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        const className = isActive
          ? 'text-xs font-semibold px-3 py-1.5 rounded-full bg-[#4FA8A0] text-[#14151F]'
          : 'text-xs font-medium px-3 py-1.5 rounded-full bg-[#1E2030] text-[#C7C9D9] border border-[#2A2C3D] hover:border-[#4FA8A0] hover:text-[#4FA8A0] transition-colors'
        return (
          <Link key={tab.href} href={tab.href} className={className}>
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}