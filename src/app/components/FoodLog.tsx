'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface FoodEntry { id: number; name: string; calories: number; source: string; sourceUrl: string | null; loggedAt: string; fromPhoto: boolean }
interface DayLog { id: number; foods: FoodEntry[] }
interface SearchResult { name: string; calories: number | null; servingSize: string | null; source: string; sourceUrl: string | null }
interface FoodLogProps { dayLog: DayLog | null; selectedDate: string; onRefresh: () => void }

function formatTime(): string {
  const now = new Date(); let h = now.getHours()
  const m = now.getMinutes().toString().padStart(2, '0'), ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12; return `${h}:${m} ${ampm}`
}

export default function FoodLog({ dayLog, selectedDate, onRefresh }: FoodLogProps) {
  const [query, setQuery] = useState(''), [results, setResults] = useState<SearchResult[]>([])
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)
  const [showDropdown, setShowDropdown] = useState(false), [highlightIdx, setHighlightIdx] = useState(-1)
  const [logging, setLogging] = useState(false), [fromPhoto, setFromPhoto] = useState(false)
  const [photoNote, setPhotoNote] = useState(''), [analyzing, setAnalyzing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const searchFood = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setShowDropdown(false); return }
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data); setShowDropdown(data.length > 0); setHighlightIdx(-1)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (selectedItem) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchFood(query), 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selectedItem, searchFood])

  const selectItem = (item: SearchResult) => { setSelectedItem(item); setQuery(item.name); setShowDropdown(false) }
  const clearSelection = () => { setSelectedItem(null); setFromPhoto(false); setPhotoNote('') }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); selectItem(results[highlightIdx]) }
    if (e.key === 'Escape') setShowDropdown(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setAnalyzing(true); clearSelection()
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1]
        const res = await fetch('/api/photo-analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageData: base64, mediaType: file.type || 'image/jpeg' }) })
        const data = await res.json()
        if (data.name && data.calories) { selectItem({ name: data.name, calories: data.calories, servingSize: null, source: 'Claude photo estimate', sourceUrl: null }); setFromPhoto(true); setPhotoNote(data.notes || '') }
      } catch { /* ignore */ }
      setAnalyzing(false)
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const logFood = async () => {
    if (!selectedItem?.calories) return
    setLogging(true)
    try {
      await fetch('/api/food', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: selectedDate, name: selectedItem.name, calories: selectedItem.calories, source: selectedItem.source, sourceUrl: selectedItem.sourceUrl, loggedAt: formatTime(), fromPhoto }) })
      setQuery(''); setSelectedItem(null); setFromPhoto(false); setPhotoNote(''); setResults([]); onRefresh()
    } catch { /* ignore */ } finally { setLogging(false) }
  }

  const foods = dayLog?.foods || [], totalConsumed = foods.reduce((sum, f) => sum + f.calories, 0)

  return (
    <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 500 }}>Food log</span>
        <span style={{ fontSize: 10, color: '#E24B4A', fontWeight: 500 }}>{totalConsumed} kcal consumed</span>
      </div>
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={query} onChange={e => { setQuery(e.target.value); clearSelection() }} onKeyDown={handleKeyDown} onFocus={() => { if (results.length > 0 && !selectedItem) setShowDropdown(true) }}
            placeholder="What did you eat? (e.g. greek yogurt, chicken breast)"
            style={{ flex: 1, border: 'none', background: 'none', fontSize: 13, color: '#374151', outline: 'none', fontFamily: 'inherit' }} />
          {selectedItem && <button onClick={logFood} disabled={logging} style={{ background: '#378ADD', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>{logging ? '…' : 'Log it'}</button>}
          <label style={{ border: 'none', background: 'none', cursor: analyzing ? 'not-allowed' : 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }} aria-label="Log from photo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={analyzing ? '#378ADD' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
        </div>
        {photoNote && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#9ca3af' }}>{photoNote}</p>}
        {showDropdown && results.length > 0 && (
          <div style={{ border: '0.5px solid #d1d5db', borderRadius: 8, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ padding: '4px 10px', fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>Best matches — click to select</div>
            {results.map((item, idx) => (
              <div key={idx} onClick={() => selectItem(item)} style={{ padding: '8px 10px', borderBottom: idx < results.length - 1 ? '0.5px solid #e5e7eb' : 'none', background: idx === highlightIdx ? '#E6F1FB' : 'white', cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{item.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: '#185FA5', fontWeight: 500 }}>{item.calories} kcal</span>
                  {item.servingSize && <span style={{ fontSize: 10, color: '#9ca3af' }}>{item.servingSize}</span>}
                  <span style={{ fontSize: 10, color: '#378ADD' }}>· {item.source}{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ marginLeft: 2, color: '#378ADD' }}>↗</a>}</span>
                </div>
              </div>
            ))}
          </div>

        )}
      </div>
      <div style={{ padding: '0 14px 10px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', padding: '8px 0 5px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <span>Logged today</span><span style={{ fontWeight: 400, color: '#9ca3af' }}>time</span>
        </div>
        {foods.length === 0 && <p style={{ fontSize: 11, color: '#d1d5db', padding: '10px 0', textAlign: 'center' }}>No food logged yet</p>}
        {foods.map((food, idx) => (
          <div key={food.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < foods.length - 1 ? '0.5px solid #e5e7eb' : 'none' }}>
            <div>
              <div style={{ fontSize: 12, color: '#111827', display: 'flex', alignItems: 'center', gap: 4 }}>
                {food.name}
                {food.fromPhoto && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{food.source}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{food.calories} kcal</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{food.loggedAt}</div>
            </div>
          </div>
        ))}
        {foods.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', fontSize: 11, fontWeight: 500, borderTop: '0.5px solid #d1d5db', marginTop: 2 }}>
            <span>Total consumed</span><span style={{ color: '#E24B4A' }}>{totalConsumed} kcal</span>
          </div>
        )}
      </div>
    </div>
  )
}
