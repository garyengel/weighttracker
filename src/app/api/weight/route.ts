import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { date, weight } = await req.json()
  const dayLog = await prisma.dayLog.upsert({
    where: { date },
    update: { weight },
    create: { date, weight },
  })
  return NextResponse.json(dayLog)
}
