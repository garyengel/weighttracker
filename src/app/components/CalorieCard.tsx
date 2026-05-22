'use client'

import { useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface FoodEntry { id: number; calories: number }
interface DayLog { id: number; date: string; foods: FoodEntry[]; stravaCalories: number | null; stravaActivity: string | null }
interface CalorieCardProps { dayLog: DayLog | null; selectedDate: string; onRefresh: () => void }

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function CalorieCard({ dayLog, selectedDate, onRefresh }: CalorieCardProps) {
  const [loading, setLoading] = useState(false)
  const [stravaMsg, setStravaMsg] = useState('')

  const base = 1115
  const rideEarned = dayLog?.stravaCalories || 0
  const consumed = dayLog?.foods?.reduce((sum, f) => sum + f.calories, 0) || 0
  const total = base + rideEarned
  const remaining = total - consumed

  const chartData = {
    datasets: [{ data: consumed > 0 || remaining > 0 ? [consumed, remaining > 0 ? remaining : 0] : [0, 1], backgroundColor: consumed > 0 || remaining > 0 ? ['#E24B4A', '#378ADD'] : ['#3a3a3c', '#3a3a3c'], borderWidth: 0 }],
  }

  const pullStrava = async () => {
    setLoading(true); setStravaMsg('')
    try {
      const res = await fetch('/api/strava', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: selectedDate }) })
      const data = await res.json()
      if (data.error) setStravaMsg(`Error: ${data.error}`)
      else if (data.message) setStravaMsg(data.message)
      else { onRefresh(); setStravaMsg('') }
    } catch { setStravaMsg('Failed to connect to Strava') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background: '#2c2c2e', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 0, alignItems: 'center' }}>
        {/* Donut chart */}
        <div style={{ padding: '16px 12px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            <Doughnut data={chartData} options={{ responsive: false, cutout: '74%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: false }} width={90} height={90} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#378ADD', lineHeight: 1 }}>{remaining}</div>
              <div style={{ fontSize: 9, color: '#636366' }}>remaining</div>
            </div>
          </div>
        </div>
        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, padding: '1px 1px 1px 0', background: '#1c1c1e' }}>
          {([['Base', '1,115', '#378ADD'], ['Ride earned', rideEarned > 0 ? `+${rideEarned}` : 'no activity', rideEarned > 0 ? '#30d158' : '#636366'], ['Consumed', String(consumed), '#E24B4A'], ['Total budget', total.toLocaleString(), '#f5f5f5']] as [string, string, string][])
            .map(([label, value, color]) => (
              <div key={label} style={{ background: '#2c2c2e', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#636366', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
        </div>
      </div>
      {/* Strava button */}
      <div style={{ borderTop: '1px solid #1c1c1e' }}>
        <button onClick={pullStrava} disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', padding: '13px 16px', color: '#f5f5f5', fontSize: 13, background: '#2c2c2e', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: loading ? '#636366' : '#30d158', flexShrink: 0, display: 'inline-block' }} />
          {loading ? 'Pulling activity…' : "Pull today's Strava activity"}
        </button>
      </div>
      {stravaMsg && <p style={{ margin: '0 16px 12px', fontSize: 11, color: '#8e8e93', textAlign: 'center' }}>{stravaMsg}</p>}
    </div>
  )
}
