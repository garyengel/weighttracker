import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getStravaAccessToken() {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, refresh_token: process.env.STRAVA_REFRESH_TOKEN, grant_type: 'refresh_token' })
  })
  return (await res.json()).access_token
}

export async function POST(req: NextRequest) {
  const { date } = await req.json()
  try {
    const accessToken = await getStravaAccessToken()
    const dayStart = new Date(date + 'T00:00:00Z').getTime() / 1000
    const dayEnd = new Date(date + 'T23:59:59Z').getTime() / 1000
    const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${dayStart}&before=${dayEnd}&per_page=10`, { headers: { Authorization: `Bearer ${accessToken}` } })
    const activities = await res.json()
    if (!Array.isArray(activities) || activities.length === 0) return NextResponse.json({ message: 'No activities found for today' })
    let totalCalories = 0
    const activityNames: string[] = []
    for (const a of activities) {
      let cal = a.calories || 0
      if (!cal && a.average_watts && a.moving_time) cal = Math.round((a.average_watts * a.moving_time) / 240)
      else if (!cal && a.moving_time) cal = Math.round(8 * 77.1 * (a.moving_time / 3600))
      totalCalories += cal
      const mi = a.distance ? (a.distance / 1609.34).toFixed(1) : null
      activityNames.push(mi ? `${a.name}, ${mi}mi` : a.name)
    }
    const dayLog = await prisma.dayLog.upsert({ where: { date }, update: { stravaCalories: totalCalories, stravaActivity: activityNames.join('; ') }, create: { date, stravaCalories: totalCalories, stravaActivity: activityNames.join('; ') } })
    return NextResponse.json({ calories: totalCalories, activity: activityNames.join('; '), dayLog })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
