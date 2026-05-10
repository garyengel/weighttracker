import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })
  const dayLog = await prisma.dayLog.findUnique({
    where: { date },
    include: { foods: { orderBy: { loggedAt: 'asc' } } }
  })
  return NextResponse.json(dayLog)
}

export async function POST(req: NextRequest) {
  const { date } = await req.json()
  const dayLog = await prisma.dayLog.upsert({
    where: { date },
    update: {},
    create: { date },
    include: { foods: true }
  })
  return NextResponse.json(dayLog)
}
