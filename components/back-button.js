'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm text-[#8A8C9C] hover:text-[#E8A33D] transition-colors mb-4"
    >
      <ArrowLeft size={20} strokeWidth={2.5} /> Back
    </button>
  )
}