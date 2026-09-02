import { supabase } from '@/lib/supabase'
import HeroCarousel from '@/components/hero-carousel'
import ProductList from '@/components/product-list'
import CategoryNav from '@/components/category-nav'
import SectionTabs from '@/components/section-tabs'

export const metadata = {
  title: 'Pokenzo - Pokémon Trading Card Game (TCG) Price Comparison for Scandinavia',
  description: 'Compare Pokémon Trading Card Game (TCG) booster box, booster pack, and Elite Trainer Box prices and stock across Norway, Sweden, and Denmark. Find the best deals from trusted stores.',
}

export default async function HomePage({ searchParams }) {
  const { type, language } = await searchParams

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, product_type, language, image_url, description, release_date, click_count, listings(current_price, currency, in_stock, stores(name, country, ships_to))')

  // Fetch raw click events from the last 7 days and tally them per product,
  // so "Most Popular (Last 7 Days)" can differ from the lifetime click_count.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentClicks } = await supabase
    .from('product_clicks')
    .select('product_id')
    .gte('created_at', sevenDaysAgo)

  const weeklyClickCounts = {}
  for (const click of recentClicks || []) {
    weeklyClickCounts[click.product_id] = (weeklyClickCounts[click.product_id] || 0) + 1
  }

  const allProducts = products || []

  let filteredProducts = allProducts
  if (type) filteredProducts = filteredProducts.filter((p) => p.product_type === type)
  if (language) filteredProducts = filteredProducts.filter((p) => p.language === language)

  const carouselProducts = allProducts.filter((p) => p.image_url)

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] pb-16">
      <HeroCarousel products={carouselProducts} />

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 mt-6">
        <p className="text-sm text-[#8A8C9C] mb-4">
          Compare Pokémon Trading Card Game (TCG) prices and stock across Scandinavia.
        </p>
        <SectionTabs active="tcg" />
        <CategoryNav activeType={type || null} activeLanguage={language || null} />
        <h1 className="sr-only">All Pokémon TCG products</h1>
        <ProductList products={filteredProducts} weeklyClickCounts={weeklyClickCounts} />
      </div>
    </main>
  )
}