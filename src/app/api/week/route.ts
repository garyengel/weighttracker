import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const startDate = req.nextUrl.searchParams.get('startDate')
  if (!startDate) return NextResponse.json({ error: 'startDate required' }, { status: 400 })
  const dates: string[] = []
  const start = new Date(startDate + 'T00:00:00')
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  const logs = await prisma.dayLog.findMany({
    where: { date: { in: dates } },
    include: { foods: true }
  })
  return NextResponse.json({ dates, logs })
}
