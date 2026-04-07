'use client'

import { useMemo } from 'react'
import * as HolidayJP from '@holiday-jp/holiday_jp'
import type { Event, User } from '@/lib/types'

type Props = {
  year: number
  month: number // 0-indexed
  events: Event[]
  users: User[]
  currentUserId: string
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

const DOW = ['日', '月', '火', '水', '木', '金', '土']

export default function CalendarGrid({
  year, month, events, users, currentUserId, selectedDate, onSelectDate
}: Props) {
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const lastDate = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: lastDate }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {}
    const lastDate = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayEvents = events.filter(ev => {
        const start = ev.start_at.slice(0, 10)
        const end = ev.end_at ? ev.end_at.slice(0, 10) : start
        return dateStr >= start && dateStr <= end
      })
      if (dayEvents.length > 0) map[dateStr] = dayEvents
    }
    return map
  }, [events, year, month])

  const holidaySet = useMemo(() => {
    const set = new Set<string>()
    const lastDate = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(year, month, d)
      if (HolidayJP.isHoliday(date)) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        set.add(dateStr)
      }
    }
    return set
  }, [year, month])

  function getUserColor(ownerId: string | null) {
    if (ownerId === null) return '#7A8FA8'
    const user = users.find(u => u.id === ownerId)
    return user?.color ?? '#7A8FA8'
  }

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={`text-center py-2 text-xs font-medium ${
              i === 0 ? 'text-wife' : i === 6 ? 'text-shared' : 'text-moss-light'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 border-t border-fog/50">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-14 border-b border-r border-fog/30" />
          }
          const dateStr = toDateStr(day)
          const dayEvents = eventsByDate[dateStr] ?? []
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const dow = idx % 7
          const isHoliday = holidaySet.has(dateStr)
          const isSundayColor = dow === 0 || isHoliday

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`h-14 flex flex-col items-center pt-1.5 border-b border-r border-fog/30 transition relative ${
                isSelected ? 'bg-moss-pale' : 'hover:bg-sand/50'
              }`}
            >
              <span
                className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                  isToday
                    ? 'bg-moss text-cream'
                    : isSundayColor
                    ? 'text-wife'
                    : dow === 6
                    ? 'text-shared'
                    : 'text-charcoal'
                }`}
              >
                {day}
              </span>
              {/* イベントドット */}
              <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                {dayEvents.slice(0, 3).map(ev => (
                  <span
                    key={ev.id}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getUserColor(ev.owner_id) }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[8px] text-moss-light">+{dayEvents.length - 3}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
