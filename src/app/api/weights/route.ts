import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const logs = await prisma.dayLog.findMany({
    where: { weight: { not: null } },
    orderBy: { date: 'asc' },
    select: { date: true, weight: true }
  })
  return NextResponse.json(logs)
}
