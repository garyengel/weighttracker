import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { date, name, calories, source, sourceUrl, loggedAt, fromPhoto } = await req.json()
  const dayLog = await prisma.dayLog.upsert({
    where: { date },
    update: {},
    create: { date },
  })
  const entry = await prisma.foodEntry.create({
    data: { dayLogId: dayLog.id, name, calories, source, sourceUrl: sourceUrl || null, loggedAt, fromPhoto: fromPhoto || false }
  })
  return NextResponse.json(entry)
}
