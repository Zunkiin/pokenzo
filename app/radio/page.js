import { supabase } from '@/lib/supabase'
import HeroCarousel from '@/components/hero-carousel'
import RadioProducts from '@/components/radio-products'
import RadioPage from '@/components/radio-page'

export const metadata = {
  title: 'Pokenzo Radio | Pokenzo',
  description: 'Chill with live lofi radio on Pokenzo.',
}

// Bufres i 5 minutter, så databasen ikke kalles på hver visning.
export const revalidate = 300

async function getData() {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, name, language, image_url, listings(current_price, currency, in_stock, stores(country, ships_to))')

    return { products: products || [] }
  } catch {
    return { products: [] }
  }
}

export default async function Page() {
  const { products } = await getData()
  const carouselProducts = products.filter((p) => p.image_url)

  const hero = carouselProducts.length > 0 ? <HeroCarousel products={carouselProducts} /> : null
  const productList = products.length > 0
    ? <RadioProducts products={products} />
    : null

  return <RadioPage hero={hero} productList={productList} />
}