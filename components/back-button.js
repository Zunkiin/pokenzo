'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C7C9D9] bg-[#1E2030] border border-[#2A2C3D] rounded-lg px-3 py-1.5 hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors mb-4"
    >
      <ArrowLeft size={18} strokeWidth={2.5} /> Back
    </button>
  )
}