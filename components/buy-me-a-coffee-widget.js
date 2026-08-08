'use client'
import { useEffect } from 'react'

export default function BuyMeACoffeeWidget() {
  useEffect(() => {
    // Avoid adding a duplicate script (React Strict Mode runs effects
    // twice in development, which would otherwise break the widget).
    if (document.querySelector('script[data-name="BMC-Widget"]')) return

    const script = document.createElement('script')
    script.setAttribute('data-name', 'BMC-Widget')
    script.setAttribute('data-cfasync', 'false')
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js'
    script.setAttribute('data-id', 'pokenzo')
    script.setAttribute('data-description', 'Support me on Buy me a coffee!')
    script.setAttribute('data-message', 'Enjoying Pokenzo? A coffee is much appreciated☕')
    script.setAttribute('data-color', '#E8A33D')
    script.setAttribute('data-position', 'Right')
    script.setAttribute('data-x_margin', '18')
    script.setAttribute('data-y_margin', '18')
    script.async = true

    document.body.appendChild(script)
  }, [])

  return null
}