'use client'

import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend } from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend)

interface WeightLog { date: string; weight: number | null }
interface WeightTrackerProps { weightLogs: WeightLog[]; selectedDate: string; onRefresh: () => void }

function formatHistoryDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function WeightTracker({ weightLogs, selectedDate, onRefresh }: WeightTrackerProps) {
  const [inputWeight, setInputWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const validLogs = weightLogs.filter(l => l.weight !== null) as { date: string; weight: number }[]

  const saveWeight = async () => {
    const w = parseFloat(inputWeight)
    if (isNaN(w) || w <= 0) return
    setSaving(true)
    try {
      await fetch('/api/weight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: selectedDate, weight: w }) })
      setInputWeight(''); onRefresh()
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  let trendDataset: object[] = []
  if (validLogs.length >= 2) {
    const n = validLogs.length, xMean = (n - 1) / 2
    const yMean = validLogs.reduce((s, l) => s + l.weight, 0) / n
    let num = 0, den = 0
    for (let i = 0; i < n; i++) { num += (i - xMean) * (validLogs[i].weight - yMean); den += (i - xMean) ** 2 }
    const slope = den !== 0 ? num / den : 0, intercept = yMean - slope * xMean
    trendDataset = [{ label: 'Trend', data: validLogs.map((_, i) => parseFloat((intercept + slope * i).toFixed(1))), borderColor: '#1D9E75', backgroundColor: 'transparent', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, fill: false, tension: 0 }]
  }

  const weights = validLogs.map(l => l.weight)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const labels = validLogs.map(l => { const [,m,d] = l.date.split('-'); return `${months[parseInt(m)-1]} ${parseInt(d)}` })
  const minW = weights.length > 0 ? Math.min(...weights) - 2 : 155
  const maxW = weights.length > 0 ? Math.max(...weights) + 2 : 175
  const chartData = { labels, datasets: [{ label: 'Weight', data: weights, borderColor: '#378ADD', backgroundColor: 'rgba(55,138,221,0.08)', borderWidth: 2, pointBackgroundColor: '#378ADD', pointRadius: 4, tension: 0.3, fill: true, spanGaps: false }, ...trendDataset] }

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = validLogs.find(l => l.date === selectedDate)
  const last7 = [...validLogs].reverse().slice(0, 7)

  return (
    <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 500 }}>Weight tracker</span>
        <span style={{ fontSize: 10, borderRadius: 4, padding: '2px 7px', background: '#E1F5EE', color: '#085041' }}>{validLogs.length} day{validLogs.length !== 1 ? 's' : ''} logged</span>
      </div>
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e7eb' }}>
        {validLogs.length >= 2
          ? <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: { parsed: { y: number } }) => `${c.parsed.y} lbs` } } }, scales: { y: { min: minW, max: maxW, ticks: { font: { size: 10 }, callback: (v: number | string) => `${v} lbs`, color: '#888' }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { ticks: { font: { size: 10 }, color: '#888' }, grid: { display: false } } } }} height={72} />
          : <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#d1d5db' }}>Log at least 2 weights to see the chart</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '0.5px solid #e5e7eb' }}>
        <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>Today&apos;s weight:</span>
        <input type="number" step="0.1" placeholder="lbs" value={inputWeight} onChange={e => setInputWeight(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveWeight()} style={{ border: '0.5px solid #e5e7eb', borderRadius: 6, padding: '5px 8px', fontSize: 13, width: 68, background: 'none', color: '#111827', textAlign: 'center', fontFamily: 'inherit' }} />
        <button onClick={saveWeight} disabled={saving || !inputWeight} style={{ background: '#1D9E75', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, padding: '6px 10px', cursor: saving || !inputWeight ? 'not-allowed' : 'pointer', opacity: saving || !inputWeight ? 0.6 : 1 }}>Save</button>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>Same time each day = consistent data</span>
      </div>
      {last7.map((log, i) => {
        const prev = last7[i + 1], delta = prev ? log.weight - prev.weight : null
        const badge = delta === null ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#f9fafb', color: '#9ca3af' }}>start</span>
          : delta < 0 ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#E1F5EE', color: '#085041' }}>{delta.toFixed(1)}</span>
          : delta > 0 ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#FCEBEB', color: '#791F1F' }}>+{delta.toFixed(1)}</span> : null
        return (
          <div key={log.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 14px', borderBottom: i < last7.length - 1 ? '0.5px solid #e5e7eb' : 'none' }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatHistoryDate(log.date)}{log.date === today ? ' (today)' : ''}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{log.weight.toFixed(1)} lbs</span>{badge}
            </div>
          </div>
        )
      })}
      {selectedDate === today && !todayLog && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 14px' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatHistoryDate(today)} (today)</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>not logged</span>
        </div>
      )}
    </div>
  )
}
