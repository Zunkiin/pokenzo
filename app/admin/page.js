import Link from 'next/link'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { loginAction, logoutAction, addStoreAction, addProductAction, addListingAction, deleteListingAction } from './actions'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const isLoggedIn = cookieStore.get('admin_auth')?.value === 'true'

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] flex items-center justify-center px-4">
        <form action={loginAction} className="w-full max-w-sm">
          <h1 className="text-lg font-semibold mb-4">Admin login</h1>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full mb-4 px-4 py-2.5 rounded-xl bg-[#1E2030] border border-[#2A2C3D] text-[#EDEAE3] placeholder-[#5C5E70] text-sm focus:outline-none focus:border-[#E8A33D]"
          />
          <button
            type="submit"
            className="w-full text-sm font-medium px-4 py-2.5 rounded-xl bg-[#E8A33D] text-[#14151F]"
          >
            Log in
          </button>
        </form>
      </main>
    )
  }

  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, country')
    .order('name')
    const { data: products } = await supabase
  .from('products')
  .select('id, name')
  .order('name')
  const { data: listings } = await supabase
  .from('listings')
  .select('id, product_id, current_price, currency, in_stock, products(name), stores(name)')
  .order('id', { ascending: false })

  return (
    <main className="min-h-screen bg-[#14151F] text-[#EDEAE3] px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold">Admin</h1>
          <form action={logoutAction}>
            <button type="submit" className="text-xs text-[#8A8C9C] hover:text-[#E8A33D]">
              Log out
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 mb-6">
          <h2 className="text-sm font-semibold mb-4">Add a store</h2>
          <form action={addStoreAction} className="space-y-3">
            <input name="store_name" placeholder="Store name" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
            <select name="store_country" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
              <option value="NO">Norway</option>
              <option value="SE">Sweden</option>
              <option value="DK">Denmark</option>
            </select>
            <input name="store_url" placeholder="https://store.com" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
            <button type="submit"
              className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#2A2C3D] text-[#EDEAE3] hover:bg-[#3A3D57]">
              Add store
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4">
          <h2 className="text-sm font-semibold mb-4">Add a product + listing</h2>
          <form action={addProductAction} className="space-y-3">
            <input name="product_name" placeholder="Product name" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />

            <select name="product_type" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
              <option value="booster_box">Booster Box</option>
              <option value="single_booster">Booster Pack</option>
              <option value="etb">Elite Trainer Box</option>
              <option value="booster_bundle">Booster Bundle</option>
            </select>

            <select name="language" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
              <option value="JP">Japanese</option>
              <option value="EN">English</option>
            </select>

            <input name="image_url" placeholder="Image URL (optional)"
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
              <textarea name="description" placeholder="Description (optional)" rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />

            <hr className="border-[#2A2C3D]" />

            <select name="store_id" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
              {stores?.map((store) => (
                <option key={store.id} value={store.id}>{store.name} ({store.country})</option>
              ))}
            </select>

            <input name="product_url" placeholder="Product page URL" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />

            <div className="flex gap-3">
              <input name="price" type="number" step="0.01" placeholder="Price" required
                className="flex-1 px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
              <select name="currency" required
                className="px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
                <option value="NOK">NOK</option>
                <option value="SEK">SEK</option>
                <option value="DKK">DKK</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#C7C9D9]">
              <input type="checkbox" name="in_stock" defaultChecked className="accent-[#E8A33D]" />
              In stock
            </label>

            <button type="submit"
              className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#E8A33D] text-[#14151F]">
              Add product
            </button>
          </form>
        </div>
        
        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 mt-6">
          <h2 className="text-sm font-semibold mb-4">Add listing to existing product</h2>
          <form action={addListingAction} className="space-y-3">
            <select name="product_id" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
              {products?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select name="store_id" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
              {stores?.map((store) => (
                <option key={store.id} value={store.id}>{store.name} ({store.country})</option>
              ))}
            </select>

            <input name="product_url" placeholder="Product page URL" required
              className="w-full px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />

            <div className="flex gap-3">
              <input name="price" type="number" step="0.01" placeholder="Price" required
                className="flex-1 px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm placeholder-[#5C5E70] focus:outline-none focus:border-[#E8A33D]" />
              <select name="currency" required
                className="px-3 py-2 rounded-lg bg-[#14151F] border border-[#2A2C3D] text-sm focus:outline-none focus:border-[#E8A33D]">
                <option value="NOK">NOK</option>
                <option value="SEK">SEK</option>
                <option value="DKK">DKK</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#C7C9D9]">
              <input type="checkbox" name="in_stock" defaultChecked className="accent-[#E8A33D]" />
              In stock
            </label>

            <button type="submit"
              className="w-full text-sm font-medium px-4 py-2 rounded-lg bg-[#2A2C3D] text-[#EDEAE3] hover:bg-[#3A3D57]">
              Add listing
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#2A2C3D] bg-[#1E2030] p-4 mt-6">
          <h2 className="text-sm font-semibold mb-4">All listings</h2>
          <div className="space-y-2">
            {listings?.map((listing) => (
        <div key={listing.id} className="flex items-center justify-between gap-2 text-sm py-2 border-b border-[#2A2C3D] last:border-0">
           <div className="min-w-0">
           <p className="truncate">{listing.products?.name}</p>
           <p className="text-xs text-[#8A8C9C]">
                {listing.stores?.name} · {listing.current_price} {listing.currency} · {listing.in_stock ? 'In stock' : 'Out of stock'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
           <Link href={`/admin/edit/${listing.product_id}`} className="text-xs text-[#4FA8A0] hover:text-[#6FC4BC]">
         Edit
         </Link>
           <form action={deleteListingAction}>
            <input type="hidden" name="listing_id" value={listing.id} />
          <button type="submit" className="text-xs text-[#C1554A] hover:text-[#E8836F]">
            Delete
             </button>
            </form>
            </div>
          </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}