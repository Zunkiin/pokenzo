import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData.user) {
    return Response.json({ error: 'Invalid session' }, { status: 401 })
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 })
  }

  return Response.json({ success: true })
}