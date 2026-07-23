'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function loginAction(formData) {
  const password = formData.get('password')
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
  }
  redirect('/admin')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_auth')
  redirect('/admin')
}

export async function addStoreAction(formData) {
  const supabase = getSupabaseAdmin()
  await supabase.from('stores').insert({
    name: formData.get('store_name'),
    country: formData.get('store_country'),
    website_url: formData.get('store_url'),
  })
  redirect('/admin')
}

export async function addProductAction(formData) {
  const supabase = getSupabaseAdmin()

  const name = formData.get('product_name')
  const slug = slugify(name)

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name,
      product_type: formData.get('product_type'),
      language: formData.get('language'),
      image_url: formData.get('image_url') || null,
      description: formData.get('description') || null,
      slug,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to add product: ' + error.message)
  }

  await supabase.from('listings').insert({
    store_id: formData.get('store_id'),
    product_id: product.id,
    product_url: formData.get('product_url'),
    currency: formData.get('currency'),
    current_price: parseFloat(formData.get('price')),
    in_stock: formData.get('in_stock') === 'on',
    last_checked_at: new Date().toISOString(),
  })

  redirect('/admin')
}

export async function addListingAction(formData) {
  const supabase = getSupabaseAdmin()

  await supabase.from('listings').insert({
    store_id: formData.get('store_id'),
    product_id: formData.get('product_id'),
    product_url: formData.get('product_url'),
    currency: formData.get('currency'),
    current_price: parseFloat(formData.get('price')),
    in_stock: formData.get('in_stock') === 'on',
    last_checked_at: new Date().toISOString(),
  })

  redirect('/admin')
}

export async function deleteListingAction(formData) {
  const supabase = getSupabaseAdmin()
  await supabase.from('listings').delete().eq('id', formData.get('listing_id'))
  redirect('/admin')
}

export async function updateProductAction(formData) {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('products')
    .update({
      name: formData.get('product_name'),
      product_type: formData.get('product_type'),
      language: formData.get('language'),
      image_url: formData.get('image_url') || null,
      description: formData.get('description') || null,
    })
    .eq('id', formData.get('product_id'))

  redirect('/admin')
}

export async function updateListingAction(formData) {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('listings')
    .update({
      current_price: parseFloat(formData.get('price')),
      in_stock: formData.get('in_stock') === 'on',
      product_url: formData.get('product_url'),
      last_checked_at: new Date().toISOString(),
    })
    .eq('id', formData.get('listing_id'))

  const redirectTo = formData.get('redirect_to') || '/admin'
  redirect(redirectTo)
}