import { supabase } from '@/lib/supabase'

// Sitemapen lages på nytt senest hver time, så nye produkter kommer med
// og slettede forsvinner uten at du må pushe.
export const revalidate = 3600

export default async function sitemap() {
  // Produktsider hentes fra Supabase. Feiler det, brukes bare de faste sidene.
  let productPages = []
  try {
    const { data: products } = await supabase.from('products').select('slug')
    productPages = (products || [])
      .filter((p) => p.slug)
      .map((p) => ({
        url: 'https://www.pokenzo.com/product/' + p.slug,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }))
  } catch {
    productPages = []
  }

  return [
    {
      url: 'https://www.pokenzo.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.pokenzo.com/pokemon-go',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://www.pokenzo.com/radio',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://www.pokenzo.com/privacy',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://www.pokenzo.com/terms',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    
    {
        url: 'https://www.pokenzo.com/pokemon-go/community-chat',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
     },
     {
        url: 'https://www.pokenzo.com/pokemon-go/trades',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
     },
     {
        url: 'https://www.pokenzo.com/pokemon-go/raids',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
     },
    {
        url: 'https://www.pokenzo.com/pokemon-go/trainers',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
    },
    ...productPages,
  ]
}