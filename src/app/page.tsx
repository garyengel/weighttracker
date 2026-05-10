'use client'

import { useState, useEffect, useCallback } from 'react'
import WeekCalendar from './components/WeekCalendar'
import CalorieCard from './components/CalorieCard'
import FoodLog from './components/FoodLog'
import WeightHero from './components/WeightHero'
import WeightTracker from './components/WeightTracker'

interface FoodEntry { id: number; name: string; calories: number; source: string; sourceUrl: string | null; loggedAt: string; fromPhoto: boolean }
interface DayLog { id: number; date: string; foods: FoodEntry[]; weight: number | null; stravaCalories: number | null; stravaActivity: string | null }
interface WeightLog { date: string; weight: number | null }

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dayLog, setDayLog] = useState<DayLog | null>(null)
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])

  const fetchDayLog = useCallback(async (date: string) => {
    try { setDayLog(await (await fetch(`/api/daylog?date=${date}`)).json()) }
    catch { setDayLog(null) }
  }, [])

  const fetchWeightLogs = useCallback(async () => {
    try { setWeightLogs(await (await fetch('/api/weights')).json()) }
    catch { setWeightLogs([]) }
  }, [])

  const refresh = useCallback(() => { fetchDayLog(selectedDate); fetchWeightLogs() }, [selectedDate, fetchDayLog, fetchWeightLogs])
  useEffect(() => { fetchDayLog(selectedDate) }, [selectedDate, fetchDayLog])
  useEffect(() => { fetchWeightLogs() }, [fetchWeightLogs])

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '16px 16px 40px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 680 }}>
        <WeekCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <CalorieCard dayLog={dayLog} selectedDate={selectedDate} onRefresh={refresh} />
        <FoodLog dayLog={dayLog} selectedDate={selectedDate} onRefresh={refresh} />
        <WeightHero weightLogs={weightLogs} />
        <WeightTracker weightLogs={weightLogs} selectedDate={selectedDate} onRefresh={refresh} />
      </div>
    </main>
  )
}
