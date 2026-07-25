export default function sitemap() {
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
  ]
}