'use client'

import { useState, useEffect } from 'react'
import { useRadio } from '@/components/radio-provider'
import Link from 'next/link'
import BackButton from '@/components/back-button'
import { Home } from 'lucide-react'

export default function RadioPage({ hero = null, productList = null }) {
  const radio = useRadio()
  const [stationsOpen, setStationsOpen] = useState(false)

  // Åpen som standard bare på desktop (to kolonner, lg og opp). Lukket på mobil.
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) setStationsOpen(true)
  }, [])
  const { stations, stationIndex, station, status, playing, volume, canSetVolume, failed } = radio
  const stationFailed = failed.includes(station.id)

  return (
    <main className={'min-h-screen text-[#EDEAE3] pb-16' + (hero ? '' : ' pt-20')}>
      {hero}
      <div className={'px-4' + (hero ? ' pt-6' : '')}>
      <div className="max-w-md md:max-w-xl lg:max-w-5xl mx-auto space-y-6">
        <div className="flex items-start gap-2 -mb-3">
          <BackButton />
          <Link
            href="/"
            aria-label="Pokenzo home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#EDEAE3] bg-[#1E2030] border border-[#2A2C3D] rounded-lg px-3 py-1.5 hover:border-[#E8A33D] transition-colors mb-4"
          >
            <img src="/logo.png" alt="" className="w-[18px] h-[18px]" />
            <span>Home</span>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-semibold mb-2">Pokenzo Radio</h1>
          <p className="text-sm text-[#8A8C9C]">
            Live lofi radio, chill here for a while...
          </p>
        </div>

        <div className={'grid grid-cols-1 gap-6 ' + (productList ? 'lg:grid-cols-2' : '')}>
        <div className="space-y-6">
        {/* Hovedspiller */}
        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-5 space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={radio.togglePlay}
              disabled={status === 'loading'}
              aria-label={playing ? 'Pause music' : 'Play music'}
              className="flex-shrink-0 w-14 h-14 rounded-full bg-[#E8A33D] text-[#14151F] text-xl font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {status === 'loading' ? '…' : playing ? '❚❚' : '▶'}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide text-[#8A8C9C]">
                {playing ? 'Now playing' : 'Selected'}
              </p>
              <p className="truncate text-base font-semibold">{station.name}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={radio.prevStation}
                aria-label="Previous station"
                className="w-9 h-9 rounded-full border border-[#4A4D67] text-lg leading-none text-[#C7C9D9] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={radio.nextStation}
                aria-label="Next station"
                className="w-9 h-9 rounded-full border border-[#4A4D67] text-lg leading-none text-[#C7C9D9] hover:border-[#E8A33D] hover:text-[#E8A33D] transition-colors"
              >
                ›
              </button>
            </div>
          </div>

          {(status === 'error' || stationFailed) && (
            <p className="text-xs text-[#8A8C9C]">This station isn&apos;t available right now. Try another one below.</p>
          )}

          <div className={'eq' + (playing ? ' eq-on' : '')} style={{ height: 40 }} aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span /><span />
            <span /><span /><span /><span /><span /><span /><span /><span />
            <span /><span /><span /><span /><span /><span /><span /><span />
          </div>

          {canSetVolume ? (
            <div>
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
            <p className="text-xs text-[#8A8C9C]">Use your phone&apos;s volume buttons to change the volume.</p>
          )}
        </div>

        {/* Stasjoner (rullgardin) */}
        <div>
          <button
            type="button"
            onClick={() => setStationsOpen((o) => !o)}
            aria-expanded={stationsOpen}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#2A2C3D] bg-[#1E2030] px-4 py-3 hover:border-[#E8A33D] transition-colors"
          >
            <span className="text-sm font-semibold text-[#E8A33D]">Stations</span>
            <span className="flex min-w-0 items-center gap-2 text-[11px] text-[#8A8C9C]">
              <span
                className={
                  'truncate max-w-[10rem] transition-opacity duration-300 ' +
                  (stationsOpen ? 'opacity-0' : 'opacity-100')
                }
              >
                {station.name}
              </span>
              <span
                className={'inline-block text-sm transition-transform duration-300 ' + (stationsOpen ? 'rotate-180' : '')}
              >
                ▾
              </span>
            </span>
          </button>

          <div
            className={
              'grid transition-all duration-300 ease-in-out ' +
              (stationsOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0')
            }
            aria-hidden={!stationsOpen}
            inert={!stationsOpen}
          >
            <div className="overflow-hidden">
              <div className="space-y-2">
                {stations.map((s, i) => {
                  const isActive = i === stationIndex
                  const isFailed = failed.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => radio.selectStation(i)}
                      aria-pressed={isActive}
                      className={
                        'w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-[14.7px] text-left transition-colors ' +
                        (isActive
                          ? 'border-[#E8A33D] bg-[#E8A33D]/10'
                          : 'border-[#2A2C3D] bg-[#1E2030] hover:border-[#E8A33D]')
                      }
                    >
                      <span className="truncate text-sm font-medium">{s.name}</span>
                      <span className="flex-shrink-0 text-[11px] text-[#8A8C9C]">
                        {isFailed ? 'Unavailable' : isActive && playing ? 'Playing' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        </div>

        {productList && (
          <section className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#E8A33D]">Pokémon TCG prices &amp; stock</h2>
            <div>{productList}</div>
          </section>
        )}
        </div>

        <p className="text-[11px] leading-relaxed text-[#5C5E70]">
          Streams are played from YouTube and belong to their respective channels.{' '}
          <a
            href={`https://www.youtube.com/watch?v=${station.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8A8C9C] hover:text-[#E8A33D] transition-colors"
          >
            Open this station on YouTube ↗
          </a>
          . Playback stops when you leave the browser on iPhone.
        </p>
      </div>
      </div>
    </main>
  )
}