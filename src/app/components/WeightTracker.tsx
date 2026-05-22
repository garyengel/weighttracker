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
    trendDataset = [{ label: 'Trend', data: validLogs.map((_, i) => parseFloat((intercept + slope * i).toFixed(1))), borderColor: '#30d158', backgroundColor: 'transparent', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, fill: false, tension: 0 }]
  }

  const weights = validLogs.map(l => l.weight)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const labels = validLogs.map(l => { const [,m,d] = l.date.split('-'); return `${months[parseInt(m)-1]} ${parseInt(d)}` })
  const minW = weights.length > 0 ? Math.min(...weights) - 2 : 155
  const maxW = weights.length > 0 ? Math.max(...weights) + 2 : 175

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Weight',
        data: weights,
        borderColor: '#378ADD',
        backgroundColor: 'rgba(55,138,221,0.06)',
        borderWidth: 2,
        pointBackgroundColor: '#378ADD',
        pointBorderColor: '#378ADD',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: false,
        spanGaps: false,
      },
      ...trendDataset
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2c2c2e',
        titleColor: '#8e8e93',
        bodyColor: '#f5f5f5',
        borderColor: '#3a3a3c',
        borderWidth: 1,
        callbacks: { label: (c: { parsed: { y: number } }) => `${c.parsed.y} lbs` }
      }
    },
    scales: {
      y: {
        min: minW,
        max: maxW,
        ticks: {
          font: { size: 10 },
          callback: (v: number | string) => `${v} lbs`,
          color: '#636366',
          maxTicksLimit: 8,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'transparent' },
      },
      x: {
        ticks: { font: { size: 10 }, color: '#636366' },
        grid: { display: false },
        border: { color: 'transparent' },
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = validLogs.find(l => l.date === selectedDate)
  const last7 = [...validLogs].reverse().slice(0, 7)

  return (
    <div style={{ background: '#2c2c2e', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c1c1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f5' }}>Weight tracker</span>
        <span style={{ fontSize: 11, borderRadius: 5, padding: '3px 8px', background: '#1c3a29', color: '#30d158' }}>
          {validLogs.length} day{validLogs.length !== 1 ? 's' : ''} logged
        </span>
      </div>

      {/* Chart */}
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid #1c1c1e' }}>
        {validLogs.length >= 2
          ? <div style={{ height: 220 }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#48484a' }}>
              Log at least 2 weights to see the chart
            </div>
        }
      </div>

      {/* History rows */}
      {last7.map((log, i) => {
        const prev = last7[i + 1], delta = prev ? log.weight - prev.weight : null
        const badge = delta === null
          ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#3a3a3c', color: '#8e8e93' }}>start</span>
          : delta < 0
            ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#1c3a29', color: '#30d158' }}>{delta.toFixed(1)}</span>
            : delta > 0
              ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#3a1c1c', color: '#E24B4A' }}>+{delta.toFixed(1)}</span>
              : null
        return (
          <div key={log.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid #1c1c1e' }}>
            <span style={{ fontSize: 12, color: '#8e8e93' }}>{formatHistoryDate(log.date)}{log.date === today ? ' (today)' : ''}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f5' }}>{log.weight.toFixed(1)} lbs</span>{badge}
            </div>
          </div>
        )
      })}
      {selectedDate === today && !todayLog && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid #1c1c1e' }}>
          <span style={{ fontSize: 12, color: '#8e8e93' }}>{formatHistoryDate(today)} (today)</span>
          <span style={{ fontSize: 13, color: '#48484a' }}>not logged</span>
        </div>
      )}

      {/* Weight input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
        <span style={{ fontSize: 13, color: '#8e8e93', flexShrink: 0 }}>Today&apos;s weight:</span>
        <input
          type="number" step="0.1" placeholder="lbs" value={inputWeight}
          onChange={e => setInputWeight(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && saveWeight()}
          style={{ flex: 1, border: '1px solid #3a3a3c', borderRadius: 8, padding: '8px 12px', fontSize: 14, background: '#1c1c1e', color: '#f5f5f5', outline: 'none', fontFamily: 'inherit', textAlign: 'center' }}
        />
        <button
          onClick={saveWeight} disabled={saving || !inputWeight}
          style={{ background: saving || !inputWeight ? '#3a3a3c' : '#2c2c2e', border: '1px solid #3a3a3c', borderRadius: 8, color: saving || !inputWeight ? '#636366' : '#f5f5f5', fontSize: 13, padding: '8px 18px', cursor: saving || !inputWeight ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
          Save
        </button>
        <span style={{ fontSize: 10, color: '#48484a', flexShrink: 0, maxWidth: 80, textAlign: 'right', lineHeight: 1.3 }}>Same time each day = consistent data</span>
      </div>
    </div>
  )
}
