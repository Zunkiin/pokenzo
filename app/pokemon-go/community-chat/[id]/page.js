import { supabase } from '@/lib/supabase'
import CommunityPost from '@/components/community-post'

export async function generateMetadata({ params }) {
  const { id } = await params
  const { data: msg } = await supabase
    .from('community_messages')
    .select('message, image_url, hidden, profiles(username)')
    .eq('id', id)
    .maybeSingle()

  if (!msg || msg.hidden) {
    return { title: 'Post not found | Pokenzo' }
  }

  const author = msg.profiles?.username || 'A trainer'
  const description = msg.message
    ? msg.message.slice(0, 150)
    : `See what ${author} shared on Pokenzo's Pokémon GO community chat.`

  // Route the image through Next's image optimizer so Discord (and other
  // link-preview crawlers) always get a widely supported format, regardless
  // of what format the original upload happened to be.
  const ogImage = msg.image_url
    ? `https://www.pokenzo.com/_next/image?url=${encodeURIComponent(msg.image_url)}&w=1200&q=75`
    : null

  return {
    title: `${author} on Pokenzo Community Chat`,
    description,
    openGraph: {
      title: `${author} on Pokenzo Community Chat`,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
    },
  }
}

export default function CommunityChatPostPage() {
  return <CommunityPost />
}