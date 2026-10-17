'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { STATIONS } from '@/lib/stations'

// Én felles YouTube-spiller for hele siden. Både den flytende knappen og /radio-siden
// bruker denne, så det kan aldri spille to strømmer samtidig, og musikken fortsetter
// når man bytter side.

const VOLUME_KEY = 'pokenzo-lofi-volume'
const STATION_KEY = 'pokenzo-radio-station'
const DEFAULT_VOLUME = 20

const RadioContext = createContext(null)

export function useRadio() {
  return useContext(RadioContext)
}

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

export default function RadioProvider({ children }) {
  const [stationIndex, setStationIndex] = useState(0)
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME)
  const [canSetVolume, setCanSetVolume] = useState(true)
  const [failed, setFailed] = useState([]) // video-ID-er som ikke kunne spilles

  const playerRef = useRef(null)
  const wrapRef = useRef(null)
  const volumeRef = useRef(DEFAULT_VOLUME)
  const indexRef = useRef(0)
  const autoplayRef = useRef(false)
  const creatingRef = useRef(false)

  // Les lagret volum og stasjon, og sjekk om det er en iPhone/iPad
  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(VOLUME_KEY), 10)
      if (!Number.isNaN(v) && v >= 0 && v <= 100) {
        setVolumeState(v)
        volumeRef.current = v
      }
      const s = parseInt(localStorage.getItem(STATION_KEY), 10)
      if (!Number.isNaN(s) && s >= 0 && s < STATIONS.length) {
        setStationIndex(s)
        indexRef.current = s
      }
    } catch {}
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

  // Gir resten av siden beskjed om at radioen spiller (glød-effektene i globals.css)
  useEffect(() => {
    document.body.classList.toggle('radio-on', playing)
    return () => document.body.classList.remove('radio-on')
  }, [playing])

  function markFailed(index) {
    const id = STATIONS[index] && STATIONS[index].id
    if (!id) return
    setFailed((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  // Lager spilleren første gang den trengs. autoplay = start musikken så snart den er klar.
  async function ensurePlayer(autoplay) {
    if (autoplay) autoplayRef.current = true
    if (playerRef.current || creatingRef.current) return
    creatingRef.current = true
    setStatus('loading')
    try {
      const YT = await loadYouTubeApi()
      const startIndex = indexRef.current
      const el = document.createElement('div')
      wrapRef.current.appendChild(el)
      playerRef.current = new YT.Player(el, {
        host: 'https://www.youtube-nocookie.com',
        videoId: STATIONS[startIndex].id,
        width: '200',
        height: '200',
        playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            e.target.setVolume(volumeRef.current)
            setStatus('ready')
            if (indexRef.current !== startIndex) {
              // Brukeren byttet stasjon mens spilleren lastet
              e.target.loadVideoById(STATIONS[indexRef.current].id)
            } else if (autoplayRef.current) {
              e.target.playVideo()
            }
          },
          onStateChange: (e) => {
            if (e.data === 1) {
              setPlaying(true)
              setStatus('ready')
            } else if (e.data === 2 || e.data === 0) {
              setPlaying(false)
            }
          },
          onError: () => {
            markFailed(indexRef.current)
            setPlaying(false)
            setStatus('error')
          },
        },
      })
    } catch {
      setStatus('error')
    } finally {
      creatingRef.current = false
    }
  }

  function selectStation(i) {
    if (i < 0 || i >= STATIONS.length) return
    indexRef.current = i
    setStationIndex(i)
    try {
      localStorage.setItem(STATION_KEY, String(i))
    } catch {}
    const p = playerRef.current
    if (p && p.loadVideoById) {
      setStatus('ready')
      p.loadVideoById(STATIONS[i].id) // starter avspilling med en gang
    } else {
      ensurePlayer(true)
    }
  }

  function nextStation() {
    selectStation((indexRef.current + 1) % STATIONS.length)
  }

  function prevStation() {
    selectStation((indexRef.current - 1 + STATIONS.length) % STATIONS.length)
  }

  function togglePlay() {
    const p = playerRef.current
    if (!p) {
      ensurePlayer(true)
      return
    }
    if (status !== 'ready' && status !== 'error') return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }

  function setVolume(v) {
    setVolumeState(v)
    volumeRef.current = v
    if (playerRef.current && playerRef.current.setVolume) playerRef.current.setVolume(v)
    try {
      localStorage.setItem(VOLUME_KEY, String(v))
    } catch {}
  }

  const value = {
    stations: STATIONS,
    stationIndex,
    station: STATIONS[stationIndex],
    status,
    playing,
    volume,
    canSetVolume,
    failed,
    ensurePlayer,
    selectStation,
    nextStation,
    prevStation,
    togglePlay,
    setVolume,
  }

  return (
    <RadioContext.Provider value={value}>
      {children}
      {/* Spilleren må ligge i DOM-en for at lyden skal spille, men skal ikke synes */}
      <div
        ref={wrapRef}
        aria-hidden="true"
        style={{ position: 'fixed', left: '-9999px', top: 0, width: 200, height: 200, overflow: 'hidden' }}
      />
    </RadioContext.Provider>
  )
}