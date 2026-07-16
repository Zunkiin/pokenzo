import { supabase } from '@/lib/supabase'
import { toNOK, formatPrice } from '@/lib/currency'
import HeroCarousel from '@/components/hero-carousel'
import ProductList from '@/components/product-list'
import CategoryNav from '@/components/category-nav'

function mapProduct(product) {
  const inStockListings = (product.listings || []).filter((l) => l.in_stock)
  let cheapest = null
  for (const listing of inStockListings) {
    const nokPrice = toNOK(listing.current_price, listing.currency)
    if (cheapest === null || nokPrice < cheapest.nokPrice) {
      cheapest = { nokPrice, price: listing.current_price, currency: listing.currency }
    }
  }
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    product_type: product.product_type,
    language: product.language,
    image_url: product.image_url,
    clickCount: product.click_count || 0,
    storeCount: product.listings ? product.listings.length : 0,
    cheapestPriceNOK: cheapest ? cheapest.nokPrice : null,
    cheapestPriceDisplay: cheapest ? formatPrice(cheapest.price, cheapest.currency) : null,
  }
}

export const metadata = {
  title: 'Pokenzo - Pokémon Trading Card Game (TCG) Price Comparison for Scandinavia',
  description: 'Compare Pokémon Trading Card Game (TCG) booster box, booster pack, and Elite Trainer Box prices and stock across Norway, Sweden, and Denmark. Find the best deals from trusted stores.',
}

export default async function HomePage({ searchParams }) {
  const { type } = await searchParams

  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, product_type, language, image_url, click_count, listings(current_price, currency, in_stock)')

  const allProducts = (products || []).map(mapProduct)
  const filteredProducts = type ? allProducts.filter((p) => p.product_type === type) : allProducts
  const carouselProducts = allProducts.filter((p) => p.image_url)

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] pb-16">
      <HeroCarousel products={carouselProducts} />

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 mt-6">
  <p className="text-sm text-[#8A8C9C] mb-4">
 Compare Pokémon Trading Card Game (TCG) prices and stock across Scandinavia.
</p>
  <CategoryNav activeType={type || null} />
        <h1 className="text-lg font-semibold mt-4 mb-4">All products</h1>
        <ProductList products={filteredProducts} />
      </div>
    </main>
  )
}