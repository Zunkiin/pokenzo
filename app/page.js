import { supabase } from '@/lib/supabase'
import HeroCarousel from '@/components/hero-carousel'
import ProductList from '@/components/product-list'
import CategoryNav from '@/components/category-nav'

export const metadata = {
  title: 'Pokenzo - Pokémon Trading Card Game (TCG) Price Comparison for Scandinavia',
  description: 'Compare Pokémon Trading Card Game (TCG) booster box, booster pack, and Elite Trainer Box prices and stock across Norway, Sweden, and Denmark. Find the best deals from trusted stores.',
}

export default async function HomePage({ searchParams }) {
  const { type, language } = await searchParams

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, product_type, language, image_url, description, click_count, listings(current_price, currency, in_stock, stores(country, ships_to))')

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
        <CategoryNav activeType={type || null} activeLanguage={language || null} />
        <h1 className="text-lg font-semibold mt-4 mb-4">All products</h1>
        <ProductList products={filteredProducts} />
      </div>
    </main>
  )
}