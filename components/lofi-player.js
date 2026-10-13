'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRadio } from '@/components/radio-provider'

// Flytende knapp nede til høyre med en liten spiller. Selve musikken ligger i RadioProvider.
export default function LofiPlayer() {
  const pathname = usePathname()
  const radio = useRadio()
  const [open, setOpen] = useState(false)

  // På /radio-siden er det en stor spiller, så den lille skjules der
  if (pathname && pathname.startsWith('/radio')) return null

  const { station, status, playing, volume, canSetVolume, failed } = radio
  const stationFailed = failed.includes(station.id)

  function handleToggleOpen() {
    const next = !open
    setOpen(next)
    // Første gang panelet åpnes laster vi spilleren, men starter ikke musikken
    if (next) radio.ensurePlayer(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-60 rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
                        <Link
              href="/radio"
              className="text-xs font-semibold text-[#EDEAE3] hover:text-[#E8A33D] transition-colors"
            >
              Pokenzo Radio ↗
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize Pokenzo Radio"
              className="flex items-center justify-center w-7 h-7 -mr-1 text-[#8A8C9C] hover:text-[#E8A33D] transition-colors"
            >
              <span className="block w-3.5 h-[3px] rounded-full bg-current" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={radio.prevStation}
              aria-label="Previous station"
              className="w-7 h-7 rounded-full border border-[#4A4D67] text-xs text-[#C7C9D9] hover:border-[#E8A33D] transition-colors"
            >
              ◀
            </button>
            <span className="flex-1 truncate text-center text-xs text-[#C7C9D9]">{station.name}</span>
            <button
              type="button"
              onClick={radio.nextStation}
              aria-label="Next station"
              className="w-7 h-7 rounded-full border border-[#4A4D67] text-xs text-[#C7C9D9] hover:border-[#E8A33D] transition-colors"
            >
              ▶
            </button>
          </div>

          {status === 'error' || stationFailed ? (
            <p className="text-xs text-[#8A8C9C]">This station isn&apos;t available. Try another one.</p>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={radio.togglePlay}
                disabled={status === 'loading'}
                aria-label={playing ? 'Pause music' : 'Play music'}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-[#E8A33D] text-[#14151F] text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {status === 'loading' ? '…' : playing ? '❚❚' : '▶'}
              </button>
              {canSetVolume ? (
                <div className="flex-1">
                  <p className="mb-1 text-[10px] text-[#8A8C9C]">Volume</p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => radio.setVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="block w-full accent-[#E8A33D]"
                  />
                </div>
              ) : (
                <span className="flex-1 text-[11px] leading-snug text-[#8A8C9C]">
                  Use your phone&apos;s volume buttons
                </span>
              )}
            </div>
          )}

          <div className={'eq mt-3' + (playing ? ' eq-on' : '')} aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span /><span />
            <span /><span /><span /><span /><span /><span /><span /><span />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <a
              href={`https://www.youtube.com/watch?v=${station.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#5C5E70] hover:text-[#E8A33D] transition-colors"
            >
              Streamed from YouTube ↗
            </a>
            <Link href="/radio" className="text-[10px] text-[#8A8C9C] hover:text-[#E8A33D] transition-colors">
              All stations →
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label={open ? 'Hide Pokenzo Radio' : 'Open Pokenzo Radio'}
        className={
          'w-11 h-11 rounded-full border text-lg transition-colors shadow-lg ' +
          (playing
            ? 'bg-gradient-to-br from-[#E8A33D]/40 to-[#E8A33D]/15 border-[#E8A33D] text-[#E8A33D]'
            : 'bg-gradient-to-br from-[#E8A33D]/25 to-[#E8A33D]/5 border-[#E8A33D]/50 text-[#E8A33D] hover:border-[#E8A33D]')
        }
      >
        🎵
      </button>
    </div>
  )
}