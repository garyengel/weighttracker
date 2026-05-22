'use client'

import { useState, useEffect, useCallback } from 'react'

interface WeekDayLog { date: string; foods: { id: number }[]; weight: number | null }
interface WeekCalendarProps { selectedDate: string; onDateChange: (date: string) => void }

function getMondayOfWeek(dateStr: string): Date {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  return monday
}

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10) }
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function WeekCalendar({ selectedDate, onDateChange }: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(selectedDate))
  const [logsByDate, setLogsByDate] = useState<Record<string, WeekDayLog>>({})

  const fetchWeek = useCallback(async (start: Date) => {
    try {
      const res = await fetch(`/api/week?startDate=${toDateStr(start)}`)
      const data = await res.json()
      const map: Record<string, WeekDayLog> = {}
      for (const log of data.logs || []) map[log.date] = log
      setLogsByDate(map)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchWeek(weekStart) }, [weekStart, fetchWeek])

  const today = new Date().toISOString().slice(0, 10)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return toDateStr(d)
  })

  return (
    <div style={{ background: '#2c2c2e', borderRadius: 12, overflow: 'hidden', padding: '12px 14px 10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '22px repeat(7,1fr) 22px', gap: 4, alignItems: 'center' }}>
        <button onClick={() => { const p = new Date(weekStart); p.setDate(p.getDate() - 7); setWeekStart(p) }}
          style={{ width: 22, height: 22, border: '1px solid #3a3a3c', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e93', fontSize: 14, background: 'none', cursor: 'pointer' }}
          aria-label="Previous week">‹</button>
        {weekDates.map((date, i) => {
          const isToday = date === today
          const isFuture = date > today
          const isSelected = date === selectedDate
          const log = logsByDate[date]
          const hasLog = log && (log.foods?.length > 0 || log.weight !== null)
          let s: React.CSSProperties = {}
          if (isToday) s = { background: '#378ADD', color: 'white' }
          else if (isSelected && !isToday) s = { background: '#3a3a3c', color: '#f5f5f5' }
          else if (isFuture) s = { border: '1px solid #3a3a3c', color: '#48484a' }
          else if (hasLog) s = { border: '2px solid #30d158', color: '#30d158' }
          else s = { border: '2px solid #E24B4A', color: '#8e8e93' }
          return (
            <button key={date} onClick={() => !isFuture && onDateChange(date)} disabled={isFuture}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: isFuture ? 'default' : 'pointer', padding: 0 }}>
              <span style={{ fontSize: 8, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{DAY_LETTERS[i]}</span>
              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, ...s }}>
                {parseInt(date.slice(8))}
              </div>
            </button>
          )
        })}
        <button onClick={() => { const n = new Date(weekStart); n.setDate(n.getDate() + 7); setWeekStart(n) }}
          style={{ width: 22, height: 22, border: '1px solid #3a3a3c', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e93', fontSize: 14, background: 'none', cursor: 'pointer' }}
          aria-label="Next week">›</button>
      </div>
      <div style={{ display: 'flex', gap: 12, paddingTop: 10 }}>
        {[{ color: '#30d158', label: 'logged', type: 'border' }, { color: '#E24B4A', label: 'no log', type: 'border' }, { color: '#378ADD', label: 'today', type: 'fill' }]
          .map(({ color, label, type }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#636366' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, ...(type === 'border' ? { border: `2px solid ${color}` } : { background: color }) }} />
              {label}
            </div>
          ))}
      </div>
    </div>
  )
}
