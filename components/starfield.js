'use client'

import { useEffect, useState } from 'react'

// Animated starfield + shooting stars. Pure CSS animation, no libraries.
// Star positions are generated in the browser after the page has loaded, so
// every page load gets a different sky. (Nothing is rendered on the server,
// so there is no hydration mismatch.) Client-side navigation between pages
// keeps the same sky, because the layout stays mounted.

const rand = (min, max) => min + Math.random() * (max - min)

function makeStars(count, size) {
  return Array.from({ length: count }, () => {
    const d = rand(2.5, 6.5)
    return {
      left: `${rand(0, 100).toFixed(2)}%`,
      top: `${rand(0, 100).toFixed(2)}%`,
      size,
      delay: `${rand(0, 6).toFixed(2)}s`,
      duration: `${d.toFixed(2)}s, ${(d * 3).toFixed(2)}s`, // twinkle, float
      fx: `${rand(-9, 9).toFixed(1)}px`,
      fy: `${rand(-9, 9).toFixed(1)}px`,
      warm: false,
    }
  })
}

function makeShooting(count) {
  return Array.from({ length: count }, () => ({
    left: `${rand(0, 70).toFixed(1)}%`,
    top: `${rand(0, 35).toFixed(1)}%`,
    delay: `${rand(2, 20).toFixed(1)}s`,
    duration: `${rand(12, 26).toFixed(1)}s`,
  }))
}

export default function Starfield() {
  const [sky, setSky] = useState(null)

  useEffect(() => {
    const small = window.innerWidth < 768 // fewer stars on phones
    setSky({
      layers: [
        { cls: 'stars-layer stars-far', stars: makeStars(small ? 35 : 55, 1) },
        { cls: 'stars-layer stars-mid', stars: makeStars(small ? 16 : 28, 2) },
        ...(small ? [] : [{ cls: 'stars-layer stars-near', stars: makeStars(12, 3) }]),
      ],
      shooting: makeShooting(3),
    })
  }, [])

  if (!sky) return null

  return (
    <div className="starfield starfield-fade" aria-hidden="true">
      {sky.layers.map((layer, i) => (
        <div key={i} className={layer.cls}>
          {layer.stars.map((s, j) => (
            <span
              key={j}
              className={`star${s.warm ? ' star-warm' : ''}`}
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
                animationDuration: s.duration,
                '--fx': s.fx,
                '--fy': s.fy,
              }}
            />
          ))}
        </div>
      ))}
      {sky.shooting.map((s, i) => (
        <span
          key={i}
          className="shooting-star"
          style={{ left: s.left, top: s.top, animationDelay: s.delay, animationDuration: s.duration }}
        />
      ))}
    </div>
  )
}