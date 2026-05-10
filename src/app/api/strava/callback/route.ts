import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  if (error) return NextResponse.json({ error: `Strava auth error: ${error}` }, { status: 400 })
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  try {
    const res = await fetch('https://www.strava.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, code, grant_type: 'authorization_code' }) })
    const data = await res.json()
    return NextResponse.json({ message: 'Strava OAuth successful. Save this refresh_token to your .env.local', refresh_token: data.refresh_token, access_token: data.access_token, athlete: data.athlete?.firstname + ' ' + data.athlete?.lastname })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
