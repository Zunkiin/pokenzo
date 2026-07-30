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
      { protocol: 'https', hostname: 'www.obs.no' },
    ],
  },
};

export default nextConfig;