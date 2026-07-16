import { redirect } from 'next/navigation'

export default async function OldProductRedirect({ params }) {
  const { slug } = await params
  redirect('/product/' + slug)
}