import { supabase } from '@/lib/supabase'
import { updateProductAction, updateListingAction } from '../../actions'
import Link from 'next/link'

export default async function EditProductPage({ params }) {
  const { id } = await params

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <p>Product not found.</p>
      </main>
    )
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('id, product_url, current_price, currency, in_stock, stores(name)')
    .eq('product_id', id)
    .order('id')

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto">
        <Link href="/admin" className="text-sm text-[#8A8C9C] hover:text-[#E8A33D] mb-6 inline-block">
          ← Back to admin
        </Link>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 mb-6">
          <h2 className="text-sm font-semibold mb-4">Edit product</h2>
          <form action={updateProductAction} className="space-y-3">
            <input type="hidden" name="product_id" value={product.id} />
            <input name="product_name" defaultValue={product.name} placeholder="Product name" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
            <select name="product_type" defaultValue={product.product_type} required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
              <option value="booster_box">Booster Box</option>
              <option value="single_booster">Booster Pack</option>
              <option value="etb">Elite Trainer Box</option>
              <option value="booster_bundle">Booster Bundle</option>
            </select>
            <select name="language" defaultValue={product.language} required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
              <option value="JP">Japanese</option>
              <option value="EN">English</option>
            </select>
            <input name="image_url" defaultValue={product.image_url || ''} placeholder="Image URL"
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-full rounded-lg" />
            )}
            <textarea name="description" defaultValue={product.description || ''} placeholder="Description" rows={4}
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
            <button type="submit"
              className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
              Save changes
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h2 className="text-sm font-semibold mb-4">Store listings</h2>
          <div className="space-y-3">
            {listings?.map((listing) => (
              <div key={listing.id} className="rounded-lg border border-[#2A2C3D] bg-[#14151F] p-3">
                <p className="text-sm font-medium mb-2">{listing.stores?.name}</p>
                <form action={updateListingAction} className="space-y-2">
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input type="hidden" name="redirect_to" value={`/admin/edit/${product.id}`} />
                  <input
                    name="product_url" defaultValue={listing.product_url}
                    placeholder="Product page URL"
                    className="w-full px-2 py-1.5 rounded-lg bg-[#1E2030] border border-[#2A2C3D] text-xs placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      name="price" type="number" step="0.01" defaultValue={listing.current_price}
                      className="w-24 px-2 py-1.5 rounded-lg bg-[#1E2030] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]"
                    />
                    <span className="text-xs text-[#8A8C9C]">{listing.currency}</span>
                    <label className="flex items-center gap-1 text-xs text-[#C7C9D9]">
                      <input type="checkbox" name="in_stock" defaultChecked={listing.in_stock} className="accent-[#E8A33D]" />
                      In stock
                    </label>
                    <button type="submit" className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#E8A33D] text-[#14151F] ml-auto">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}