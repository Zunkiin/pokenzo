export const NOK_RATE = { NOK: 1, SEK: 1.01, DKK: 1.475 }

export const COUNTRY_CURRENCY = { NO: 'NOK', SE: 'SEK', DK: 'DKK' }

export function toNOK(price, currency) {
  if (price == null) return null
  return price * (NOK_RATE[currency] ?? 1)
}

export function convertCurrency(price, fromCurrency, toCurrency) {
  if (price == null) return null
  const nokValue = toNOK(price, fromCurrency)
  return nokValue / (NOK_RATE[toCurrency] ?? 1)
}

export function formatPrice(price, currency) {
  if (price == null) return '–'
  return Math.round(price).toLocaleString('en-GB') + ' ' + currency
}