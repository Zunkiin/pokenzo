'use client'

import { useEffect, useRef, useState } from 'react'

// YouTube-video som spilles (24/7 lofi-strøm). Bytt ID her hvis du vil ha en annen.
const VIDEO_ID = 'ITV29NndpYA'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const VOLUME_KEY = 'pokenzo-lofi-volume'

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

function readSavedVolume() {
  try {
    const saved = parseInt(localStorage.getItem(VOLUME_KEY), 10)
    if (!Number.isNaN(saved) && saved >= 0 && saved <= 100) return saved
  } catch {}
  return 40
}

export default function LofiPlayer() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(40)

  const playerRef = useRef(null)
  const wrapRef = useRef(null)
  const volumeRef = useRef(40)

  useEffect(() => {
    const saved = readSavedVolume()
    setVolume(saved)
    volumeRef.current = saved
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

  function handleVolume(e) {
    const v = Number(e.target.value)
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
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolume}
                aria-label="Volume"
                className="flex-1 accent-[#E8A33D]"
              />
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
          'w-11 h-11 rounded-full bg-[#1E2030] border text-lg transition-colors ' +
          (playing
            ? 'border-[#E8A33D] text-[#E8A33D]'
            : 'border-[#2A2C3D] text-[#C7C9D9] hover:border-[#E8A33D]')
        }
      >
        🎵
      </button>
    </div>
  )
}