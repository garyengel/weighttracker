'use client'

interface WeightLog { date: string; weight: number | null }
interface WeightHeroProps { weightLogs: WeightLog[] }

export default function WeightHero({ weightLogs }: WeightHeroProps) {
  const startingWeight = 170, goalWeight = 155, totalToLose = 15
  const validLogs = weightLogs.filter(l => l.weight !== null) as { date: string; weight: number }[]
  const currentWeight = validLogs.length > 0 ? validLogs[validLogs.length - 1].weight : null
  const lostSoFar = currentWeight !== null ? Math.max(0, startingWeight - currentWeight) : 0
  const progressPct = Math.min(100, (lostSoFar / totalToLose) * 100)

  let eta = '~Aug 2026'
  if (validLogs.length >= 7) {
    const first = validLogs[0], last = validLogs[validLogs.length - 1]
    const daysDiff = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000
    if (daysDiff > 0) {
      const dailyLoss = (first.weight - last.weight) / daysDiff
      if (dailyLoss > 0 && currentWeight !== null) {
        const etaDate = new Date()
        etaDate.setDate(etaDate.getDate() + Math.round((currentWeight - goalWeight) / dailyLoss))
        eta = etaDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    }
  }

  return (
    <div style={{ background: '#042C53', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 500, color: '#fff', lineHeight: 1 }}>{currentWeight !== null ? `${currentWeight.toFixed(1)} lbs` : '-- lbs'}</div>
          <div style={{ fontSize: 10, color: '#85B7EB', marginTop: 3 }}>current weight</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#1D9E75' }}>Goal: {goalWeight} lbs</div>
          <div style={{ fontSize: 10, color: '#85B7EB', marginTop: 2 }}>est. {eta} at this pace</div>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 4, marginBottom: 5 }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: '#1D9E75', borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#85B7EB' }}>
        <span>{startingWeight}</span>
        <span style={{ color: '#1D9E75' }}>{lostSoFar > 0 ? lostSoFar.toFixed(1) : '0'} of {totalToLose} lbs lost</span>
        <span>{goalWeight}</span>
      </div>
    </div>
  )
}
