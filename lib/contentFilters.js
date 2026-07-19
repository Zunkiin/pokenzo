const LINK_REGEX = /(https?:\/\/|www\.|\b[a-zA-Z0-9-]+\.(com|net|org|io|co|no|se|dk|link|xyz|click|gg|app|dev|me|info|biz)\b)/i

export function containsLink(text) {
  if (!text) return false
  return LINK_REGEX.test(text)
}