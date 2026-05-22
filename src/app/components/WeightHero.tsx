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
    <div style={{ background: '#2c2c2e', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#f5f5f5', lineHeight: 1 }}>{currentWeight !== null ? `${currentWeight.toFixed(1)} lbs` : '-- lbs'}</div>
          <div style={{ fontSize: 10, color: '#636366', marginTop: 4 }}>current weight</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#30d158', fontWeight: 500 }}>Goal: {goalWeight} lbs</div>
          <div style={{ fontSize: 10, color: '#636366', marginTop: 2 }}>est. {eta} at this pace</div>
        </div>
      </div>
      <div style={{ height: 6, background: '#3a3a3c', borderRadius: 3, marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: '#30d158', borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#636366' }}>
        <span>{startingWeight} lbs</span>
        <span style={{ color: '#30d158' }}>{lostSoFar > 0 ? lostSoFar.toFixed(1) : '0'} of {totalToLose} lbs lost</span>
        <span>{goalWeight} lbs</span>
      </div>
    </div>
  )
}
