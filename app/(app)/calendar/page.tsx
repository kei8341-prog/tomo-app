'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import DayPanel from '@/components/calendar/DayPanel'
import EventSheet from '@/components/calendar/EventSheet'
import type { Event, User } from '@/lib/types'

export default function CalendarPage() {
  const supabase = createClient()
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  })
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [coupleId, setCoupleId] = useState<string>('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!userData) return
      setCurrentUser(userData)
      setCoupleId(userData.couple_id)

      const { data: coupleUsers } = await supabase
        .from('users')
        .select('*')
        .eq('couple_id', userData.couple_id)

      setUsers(coupleUsers ?? [])
    }
    init()
  }, [])

  const fetchEvents = useCallback(async () => {
    if (!coupleId) return
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('start_at', `${from}T00:00:00`)
      .lte('start_at', `${to}T23:59:59`)
      .order('start_at')

    setEvents(data ?? [])
  }, [coupleId, year, month])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // リアルタイム同期
  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `couple_id=eq.${coupleId}` }, () => {
        fetchEvents()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [coupleId, fetchEvents])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const selectedEvents = events.filter(ev => ev.start_at.slice(0, 10) === selectedDate)

  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen text-moss-light">読み込み中...</div>
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 text-moss-light hover:text-moss transition">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="font-heading text-2xl text-charcoal">
          {year}年 {month + 1}月
        </h2>
        <button onClick={nextMonth} className="p-2 text-moss-light hover:text-moss transition">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* カレンダーグリッド */}
      <CalendarGrid
        year={year}
        month={month}
        events={events}
        users={users}
        currentUserId={currentUser.id}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* 選択日の予定パネル */}
      <DayPanel
        date={selectedDate}
        events={selectedEvents}
        users={users}
        currentUserId={currentUser.id}
        onAddEvent={() => { setEditingEvent(null); setSheetOpen(true) }}
        onEditEvent={ev => { setEditingEvent(ev); setSheetOpen(true) }}
      />

      {/* 予定シート */}
      <EventSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditingEvent(null) }}
        event={editingEvent}
        defaultDate={selectedDate}
        currentUser={currentUser}
        users={users}
        coupleId={coupleId}
      />
    </div>
  )
}
