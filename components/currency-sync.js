'use client'
import { useEffect } from 'react'

const COUNTRY_TO_CURRENCY = { NO: 'NOK', SE: 'SEK', DK: 'DKK' }

export default function CurrencySync() {
  useEffect(() => {
    function syncCurrency(storeSelectId, currencySelectId) {
      const storeSelect = document.getElementById(storeSelectId)
      const currencySelect = document.getElementById(currencySelectId)
      if (!storeSelect || !currencySelect) return () => {}

      function handleChange() {
        const selectedOption = storeSelect.options[storeSelect.selectedIndex]
        const country = selectedOption ? selectedOption.getAttribute('data-country') : null
        if (country && COUNTRY_TO_CURRENCY[country]) {
          currencySelect.value = COUNTRY_TO_CURRENCY[country]
        }
      }

      storeSelect.addEventListener('change', handleChange)
      return () => storeSelect.removeEventListener('change', handleChange)
    }

    const cleanupAdd = syncCurrency('store_id_add', 'currency_add')
    const cleanupListing = syncCurrency('store_id_listing', 'currency_listing')

    return () => {
      cleanupAdd()
      cleanupListing()
    }
  }, [])

  return null
}