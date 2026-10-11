/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'boosterpakker.no' },
      { protocol: 'https', hostname: 'cardcenter.no' },
      { protocol: 'https', hostname: 'collectible.no' },
      { protocol: 'https', hostname: 'pokestore.no' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'www.maxgaming.no' },
      { protocol: 'https', hostname: 'www.maxgaming.se' },
      { protocol: 'https', hostname: 'www.maxgaming.dk' },
      { protocol: 'https', hostname: 'www.mythic.no' },
      { protocol: 'https', hostname: 'oyanpkxgduestvmapzpc.supabase.co' },
      { protocol: 'https', hostname: 'www.obs.no' },
      { protocol: 'https', hostname: 'cdn.quickbutik.com' },
      { protocol: 'https', hostname: 'rogerz.dk' },
      { protocol: 'https', hostname: 'www.cardero.no' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'www.pokenordic.no' },
      { protocol: 'https', hostname: 'speltrollet.se' },
      { protocol: 'https', hostname: 'www.boosterpakker.no' },
      { protocol: 'https', hostname: 'pokebud.no' },
    ],
  },
};

export default nextConfig;