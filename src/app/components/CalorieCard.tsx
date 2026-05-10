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
    datasets: [{ data: consumed > 0 || remaining > 0 ? [consumed, remaining > 0 ? remaining : 0] : [0, 1], backgroundColor: consumed > 0 || remaining > 0 ? ['#E24B4A', '#378ADD'] : ['#e5e7eb', '#e5e7eb'], borderWidth: 0 }],
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
    <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 500 }}>Calories — {formatDate(selectedDate)}</span>
        <span style={{ fontSize: 10, borderRadius: 4, padding: '2px 7px', background: '#E1F5EE', color: '#085041' }}>{remaining} remaining</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, alignItems: 'center', padding: '12px 14px' }}>
        <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
          <Doughnut data={chartData} options={{ responsive: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: false }} width={100} height={100} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#378ADD', lineHeight: 1 }}>{remaining}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>remaining</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {[['Base', '1,115', '#378ADD'], ['Ride earned', rideEarned > 0 ? `+${rideEarned}` : 'no activity', rideEarned > 0 ? '#1D9E75' : '#9ca3af'], ['Consumed', String(consumed), '#E24B4A'], ['Total budget', total.toLocaleString(), 'inherit']]
            .map(([label, value, color]) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: 6, padding: '6px 8px' }}>
                <div style={{ fontSize: 9, color: '#9ca3af' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color }}>{value}</div>
              </div>
            ))}
        </div>
      </div>
      <button onClick={pullStrava} disabled={loading}
        style={{ margin: '0 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '0.5px solid #378ADD', borderRadius: 6, padding: '6px 10px', color: '#378ADD', fontSize: 11, background: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: 'calc(100% - 28px)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#d1d5db' : '#1D9E75', flexShrink: 0, display: 'inline-block' }} />
        {loading ? 'Pulling activity…' : "Pull today's Strava activity"}
      </button>
      {stravaMsg && <p style={{ margin: '0 14px 10px', fontSize: 10, color: '#6b7280', textAlign: 'center' }}>{stravaMsg}</p>}
    </div>
  )
}
