'use client'

import { useEffect, useRef, useState } from 'react'

// YouTube-video som spilles (24/7 lofi-strøm). Bytt ID her hvis du vil ha en annen.
const VIDEO_ID = 'ITV29NndpYA'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const VOLUME_KEY = 'pokenzo-lofi-volume'

// Tre volumnivåer (0-100). Endre tallene her hvis du vil ha dem høyere eller lavere.
const VOLUME_LEVELS = [
  { label: 'Low', value: 15 },
  { label: 'Medium', value: 35 },
  { label: 'High', value: 60 },
]
const DEFAULT_VOLUME = VOLUME_LEVELS[0].value

function loadYouTubeApi() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT)
      return
    }
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (previous) previous()
      resolve(window.YT)
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
}

// Finner nærmeste nivå (Low/Medium/High) til et volum, brukes til å markere valgt knapp på mobil
function nearestLevel(v) {
  return VOLUME_LEVELS.reduce((best, l) =>
    Math.abs(l.value - v) < Math.abs(best.value - v) ? l : best
  ).value
}

function readSavedVolume() {
  try {
    const saved = parseInt(localStorage.getItem(VOLUME_KEY), 10)
    if (!Number.isNaN(saved) && saved >= 0 && saved <= 100) return saved
  } catch {}
  return DEFAULT_VOLUME
}

export default function LofiPlayer() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [canSetVolume, setCanSetVolume] = useState(true)

  const playerRef = useRef(null)
  const wrapRef = useRef(null)
  const volumeRef = useRef(DEFAULT_VOLUME)

  useEffect(() => {
    const saved = readSavedVolume()
    setVolume(saved)
    volumeRef.current = saved
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (isIOS) setCanSetVolume(false)
    return () => {
      try {
        if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy()
      } catch {}
      playerRef.current = null
    }
  }, [])

  // Gir resten av siden beskjed om at radioen spiller (brukes av glød-effektene i globals.css)
  useEffect(() => {
    document.body.classList.toggle('radio-on', playing)
    return () => document.body.classList.remove('radio-on')
  }, [playing])

  async function createPlayer() {
    setStatus('loading')
    try {
      const YT = await loadYouTubeApi()
      const el = document.createElement('div')
      wrapRef.current.appendChild(el)
      playerRef.current = new YT.Player(el, {
        host: 'https://www.youtube-nocookie.com',
        videoId: VIDEO_ID,
        width: '200',
        height: '200',
        playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            e.target.setVolume(volumeRef.current)
            setStatus('ready')
          },
          onStateChange: (e) => {
            if (e.data === 1) setPlaying(true)
            else if (e.data === 2 || e.data === 0) setPlaying(false)
          },
          onError: () => setStatus('error'),
        },
      })
    } catch {
      setStatus('error')
    }
  }

  function handleToggleOpen() {
    const next = !open
    setOpen(next)
    // Første gang panelet åpnes starter vi lasting og avspilling (krever et trykk fra brukeren)
    if (next && !playerRef.current && status === 'idle') createPlayer()
  }

  function handlePlayPause() {
    const p = playerRef.current
    if (!p || status !== 'ready') return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }

  function handleVolume(v) {
    setVolume(v)
    volumeRef.current = v
    if (playerRef.current && playerRef.current.setVolume) playerRef.current.setVolume(v)
    try {
      localStorage.setItem(VOLUME_KEY, String(v))
    } catch {}
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Spilleren må ligge i DOM-en for at lyden skal spille, men skal ikke synes */}
      <div
        ref={wrapRef}
        aria-hidden="true"
        style={{ position: 'fixed', left: '-9999px', top: 0, width: 200, height: 200, overflow: 'hidden' }}
      />

      {open && (
        <div className="w-60 rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#EDEAE3]">Poke Radio</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize Poke Radio"
              className="flex items-center justify-center w-7 h-7 -mr-1 text-[#8A8C9C] hover:text-[#E8A33D] transition-colors"
            >
              <span className="block w-3.5 h-[3px] rounded-full bg-current" />
            </button>
          </div>

          {status === 'error' ? (
            <p className="text-xs text-[#8A8C9C]">
              Couldn&apos;t load the stream right now. Try again later.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayPause}
                disabled={status !== 'ready'}
                aria-label={playing ? 'Pause music' : 'Play music'}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-[#E8A33D] text-[#14151F] text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {status === 'loading' ? '…' : playing ? '❚❚' : '▶'}
              </button>
              {canSetVolume ? (
                <div className="flex-1">
                  <p className="mb-1 text-[10px] text-[#8A8C9C]">Volume</p>
                  {/* PC: slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolume(Number(e.target.value))}
                    aria-label="Volume"
                    className="hidden md:block w-full accent-[#E8A33D]"
                  />
                  {/* Mobil: Low / Medium / High */}
                  <div className="md:hidden" role="group" aria-label="Volume">
                    <div className="flex gap-1">
                      {VOLUME_LEVELS.map((l) => (
                        <button
                          key={l.label}
                          type="button"
                          onClick={() => handleVolume(l.value)}
                          aria-pressed={nearestLevel(volume) === l.value}
                          className={
                            'flex-1 rounded-full border px-1 py-1.5 text-[11px] font-medium transition-colors ' +
                            (nearestLevel(volume) === l.value
                              ? 'bg-[#E8A33D]/20 border-[#E8A33D] text-[#E8A33D]'
                              : 'bg-[#14151F] border-[#4A4D67] text-[#C7C9D9] hover:border-[#E8A33D]')
                          }
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
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

          <a
            href={VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[10px] text-[#5C5E70] hover:text-[#E8A33D] transition-colors"
          >
            Streamed from YouTube ↗
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label={open ? 'Hide Poke Radio' : 'Open Poke Radio'}
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