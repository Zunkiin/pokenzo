import { supabase } from '@/lib/supabase'
import { toNOK, convertCurrency, formatPrice, COUNTRY_CURRENCY } from '@/lib/currency'
import Link from 'next/link'
import { Suspense } from 'react'
import BackButton from '@/components/back-button'
import ProductListings from '@/components/product-listings'
import ProductSuggestions from '@/components/product-suggestions'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function formatProductType(type) {
  const labels = {
    booster_box: 'Booster Box',
    single_booster: 'Booster Pack',
    etb: 'Elite Trainer Box',
    booster_bundle: 'Booster Bundle',
    collection_box: 'Collection Box',
    tin_box: 'Tin Box',
  }
  return labels[type] || type
}


export async function generateMetadata({ params }) {
  const { slug } = await params
  const { data: product } = await supabase
    .from('products')
    .select('name, image_url, description')
    .eq('slug', slug)
    .single()

  if (!product) {
    return { title: 'Product not found | Pokenzo' }
  }

  const description = product.description || `Compare prices for ${product.name} across Norway, Sweden and Denmark.`

  // Discord (and some other link-preview crawlers) don't render AVIF images.
  // Routing through Next's built-in image optimizer converts the source image
  // (whatever format the store's own CDN happens to serve) to a widely supported
  // format like WebP/JPEG before it's used as the OG/Twitter preview image.
  const ogImage = product.image_url
    ? `https://www.pokenzo.com/_next/image?url=${encodeURIComponent(product.image_url)}&w=1200&q=75`
    : null

  return {
    title: `${product.name} | Pokenzo`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
    },
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params
  const { data: product } = await supabase
    .from('products')
    .select('id, slug, name, product_type, language, image_url, click_count, description')
    .eq('slug', slug)
    .single()

  if (product) {
    // Fire-and-forget: the click counter doesn't need to block the page
    // from rendering - nobody needs to see this write finish.
    const supabaseAdmin = getSupabaseAdmin()
    supabaseAdmin
      .from('products')
      .update({ click_count: (product.click_count || 0) + 1 })
      .eq('id', product.id)
      .then(() => {})

    // Also log this click with a timestamp, so popularity can be filtered
    // by time period (last 7 days, last 30 days, etc), not just a lifetime total.
    supabaseAdmin
      .from('product_clicks')
      .insert({ product_id: product.id })
      .then(() => {})
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('id, product_url, currency, current_price, in_stock, last_checked_at, stores(name, country, ships_to, is_affiliate)')
    .eq('product_id', product?.id)

  if (!product) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-6">
        <p className="text-center">Product not found.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pb-16 pt-16">
      <div className="max-w-md mx-auto">
        <BackButton />

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8A8C9C] mb-2">
            {product.language === 'JP' ? 'Japanese' : product.language === 'EN' ? 'English' : product.language === 'CN' ? 'Chinese' : ''} · {formatProductType(product.product_type)}
          </p>
          <h1 className="text-2xl font-semibold leading-tight mb-4">
            {product.name}
          </h1>
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full rounded-xl mb-4"
            />
          )}
          {product.description && (
            <p className="text-sm text-[#8A8C9C] mb-4">
              {product.description}
            </p>
          )}
        </div>

        <ProductListings listings={listings || []} />

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <a href="https://discord.gg/hxkk9XhdwT"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl bg-[#1E2030] border border-[#8A8C9C] text-[#C7C9D9] hover:bg-[#2A2C3D] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419z"/>
            </svg>
            Get alerts on Discord
          </a>

          <a
            href="https://buymeacoffee.com/pokenzo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl bg-[#E8A33D]/15 text-[#E8A33D] border border-[#E8A33D] hover:bg-[#E8A33D]/25 transition-colors"
          >
            <span>☕</span>
            Buy me a coffee
          </a>
        </div>

        <Suspense fallback={
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-[#8A8C9C] mb-3">You might also like</h2>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl border border-[#2A2C3D] bg-[#1E2030] animate-pulse" />
              ))}
            </div>
          </div>
        }>
          <ProductSuggestions productType={product.product_type} excludeId={product.id} />
        </Suspense>
      </div>
    </main>
  )
}