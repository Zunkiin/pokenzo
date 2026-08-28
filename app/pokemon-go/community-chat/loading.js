export default function Loading() {
  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center">
      <img
        src="/logo.png"
        alt="Loading"
        className="w-16 h-16 animate-spin"
        style={{ animationDuration: '1.5s' }}
      />
    </main>
  )
}