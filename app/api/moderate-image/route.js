export async function POST(request) {
  const { imageUrl } = await request.json()

  const apiUser = process.env.SIGHTENGINE_API_USER
  const apiSecret = process.env.SIGHTENGINE_API_SECRET

  const params = new URLSearchParams({
    url: imageUrl,
    models: 'nudity-2.1,offensive',
    api_user: apiUser,
    api_secret: apiSecret,
  })

  try {
    const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params.toString()}`)
    const data = await res.json()

    const nudityScore = data.nudity?.sexual_activity ?? 0
    const nudityScore2 = data.nudity?.sexual_display ?? 0
    const offensiveScore = data.offensive?.prob ?? 0
    const goreScore = data.gore?.prob ?? 0

    const isFlagged = nudityScore > 0.4 || nudityScore2 > 0.4 || offensiveScore > 0.5 || goreScore > 0.5

    return Response.json({ approved: !isFlagged, raw: data })
  } catch (err) {
    return Response.json({ approved: false, error: err.message }, { status: 500 })
  }
}