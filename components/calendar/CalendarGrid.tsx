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

type DayCell = {
  day: number
  inMonth: boolean
  dateStr: string
}

const DOW = ['月', '火', '水', '木', '金', '土', '日'] // 月曜始まり

// Layout constants (px)
const CELL_H = 96       // h-24
const DATE_H = 30       // 日付数字エリア高さ (pt-1 + h-6 + mb-0.5)
const BAR_H = 13        // イベントバー高さ
const BAR_GAP = 2       // バー間隔
const BAR_OFFSET = DATE_H + 2 // 複数日バー開始Y（セル内）

function makeDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarGrid({
  year, month, events, users, currentUserId, selectedDate, onSelectDate
}: Props) {
  // 月曜始まり: 月=0, 火=1, ... 土=5, 日=6
  const firstDay = useMemo(() => (new Date(year, month, 1).getDay() + 6) % 7, [year, month])
  const lastDate = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])

  const days = useMemo((): DayCell[] => {
    const cells: DayCell[] = []

    // 前月の日付
    const prevYear = month === 0 ? year - 1 : year
    const prevMonth = month === 0 ? 11 : month - 1
    const prevLastDate = new Date(prevYear, prevMonth + 1, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevLastDate - i
      cells.push({ day: d, inMonth: false, dateStr: makeDateStr(prevYear, prevMonth, d) })
    }

    // 当月の日付
    for (let d = 1; d <= lastDate; d++) {
      cells.push({ day: d, inMonth: true, dateStr: makeDateStr(year, month, d) })
    }

    // 翌月の日付（グリッドを7の倍数に補完）
    const nextYear = month === 11 ? year + 1 : year
    const nextMonth = month === 11 ? 0 : month + 1
    let nextDay = 1
    while (cells.length % 7 !== 0) {
      cells.push({ day: nextDay, inMonth: false, dateStr: makeDateStr(nextYear, nextMonth, nextDay) })
      nextDay++
    }

    return cells
  }, [firstDay, lastDate, year, month])

  const holidaySet = useMemo(() => {
    const set = new Set<string>()
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(year, month, d)
      if (HolidayJP.isHoliday(date)) {
        set.add(makeDateStr(year, month, d))
      }
    }
    return set
  }, [year, month, lastDate])

  function getUserColor(ownerId: string | null) {
    if (ownerId === null) return '#7A8FA8'
    return users.find(u => u.id === ownerId)?.color ?? '#7A8FA8'
  }

  function toDateStr(d: number) {
    return makeDateStr(year, month, d)
  }

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  })()

  // 複数日イベント（monthにまたがる部分をクランプ）のセグメントを計算
  const multiDaySegments = useMemo(() => {
    const monthStart = toDateStr(1)
    const monthEnd = toDateStr(lastDate)

    // 複数日イベントのみ抽出・ソート（長いもの優先、同じなら開始日順）
    const multiDay = events
      .filter(ev => {
        const end = ev.end_at?.slice(0, 10) ?? ev.start_at.slice(0, 10)
        return end > ev.start_at.slice(0, 10)
      })
      .sort((a, b) => {
        const aLen = (a.end_at?.slice(0, 10) ?? a.start_at.slice(0, 10)).localeCompare(a.start_at.slice(0, 10))
        const bLen = (b.end_at?.slice(0, 10) ?? b.start_at.slice(0, 10)).localeCompare(b.start_at.slice(0, 10))
        if (aLen !== bLen) return bLen > aLen ? 1 : -1
        return a.start_at.localeCompare(b.start_at)
      })

    type Segment = {
      ev: Event
      row: number
      colStart: number
      colEnd: number
      isStart: boolean
      isEnd: boolean
      lane: number
    }

    const segments: Segment[] = []
    // 各セルのレーン使用状況
    const laneUsed: Record<string, boolean[]> = {}

    function getLane(startIdx: number, endIdx: number): number {
      for (let lane = 0; lane < 3; lane++) {
        let free = true
        for (let i = startIdx; i <= endIdx; i++) {
          const key = String(i)
          if (laneUsed[key]?.[lane]) { free = false; break }
        }
        if (free) return lane
      }
      return -1 // 表示不可
    }

    function markLane(startIdx: number, endIdx: number, lane: number) {
      for (let i = startIdx; i <= endIdx; i++) {
        const key = String(i)
        if (!laneUsed[key]) laneUsed[key] = []
        laneUsed[key][lane] = true
      }
    }

    multiDay.forEach(ev => {
      const evStart = ev.start_at.slice(0, 10)
      const evEnd = ev.end_at!.slice(0, 10)
      const clampStart = evStart < monthStart ? monthStart : evStart
      const clampEnd = evEnd > monthEnd ? monthEnd : evEnd

      const startDay = parseInt(clampStart.slice(8, 10))
      const endDay = parseInt(clampEnd.slice(8, 10))
      const startIdx = startDay - 1 + firstDay
      const endIdx = endDay - 1 + firstDay

      const lane = getLane(startIdx, endIdx)
      if (lane < 0) return
      markLane(startIdx, endIdx, lane)

      // 行をまたぐ場合は複数セグメントに分割
      let i = startIdx
      while (i <= endIdx) {
        const rowEndIdx = Math.min(endIdx, Math.floor(i / 7) * 7 + 6)
        segments.push({
          ev,
          row: Math.floor(i / 7),
          colStart: i % 7,
          colEnd: rowEndIdx % 7,
          isStart: i === startIdx,
          isEnd: rowEndIdx === endIdx,
          lane,
        })
        i = rowEndIdx + 1
      }
    })

    return segments
  }, [events, firstDay, lastDate, year, month])

  // 単日イベント（複数日イベントを除く）— 全セル対象
  const singleDayByDate = useMemo(() => {
    const multiIds = new Set(
      events
        .filter(ev => (ev.end_at?.slice(0, 10) ?? ev.start_at.slice(0, 10)) > ev.start_at.slice(0, 10))
        .map(ev => ev.id)
    )
    const map: Record<string, Event[]> = {}
    days.forEach(cell => {
      const dayEvents = events.filter(ev => !multiIds.has(ev.id) && ev.start_at.slice(0, 10) === cell.dateStr)
      if (dayEvents.length > 0) map[cell.dateStr] = dayEvents
    })
    return map
  }, [events, days])

  // 複数日イベントが通過している日付のセット（当月のみ）
  const multiDayDates = useMemo(() => {
    const set = new Set<string>()
    multiDaySegments.forEach(seg => {
      for (let col = seg.colStart; col <= seg.colEnd; col++) {
        const day = seg.row * 7 + col - firstDay + 1
        if (day >= 1 && day <= lastDate) set.add(toDateStr(day))
      }
    })
    return set
  }, [multiDaySegments, firstDay, lastDate, year, month])

  const totalRows = days.length / 7

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={`text-center py-2 text-xs font-medium ${
              i === 5 ? 'text-shared' : i === 6 ? 'text-wife' : 'text-moss-light'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* グリッド + 複数日バーオーバーレイ */}
      <div className="relative border-t border-fog/50">
        {/* 日付セルグリッド */}
        <div className="grid grid-cols-7">
          {days.map((cell, idx) => {
            const { day, inMonth, dateStr } = cell
            const dayEvents = singleDayByDate[dateStr] ?? []
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const dow = idx % 7
            const isHoliday = inMonth && holidaySet.has(dateStr)
            const isSundayColor = (dow === 6 || isHoliday) && inMonth // 日曜は6番目
            const isSaturdayColor = dow === 5 && inMonth
            const hasMultiDay = multiDayDates.has(dateStr)

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`h-24 flex flex-col pt-1 border-b border-r border-fog/30 transition w-full ${
                  isSelected ? 'bg-moss-pale' : 'hover:bg-sand/50'
                }`}
              >
                {/* 日付 */}
                <div className="flex justify-center mb-0.5">
                  <span
                    className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                      !inMonth
                        ? 'text-fog/60'
                        : isToday
                        ? 'bg-moss text-cream'
                        : isSundayColor
                        ? 'text-wife'
                        : isSaturdayColor
                        ? 'text-shared'
                        : 'text-charcoal'
                    }`}
                  >
                    {day}
                  </span>
                </div>
                {/* イベント */}
                <div className={`w-full space-y-0.5 px-0.5 ${hasMultiDay ? 'mt-[18px]' : 'mt-0.5'} ${!inMonth ? 'opacity-50' : ''}`}>
                  {dayEvents.slice(0, 3).map(ev => {
                    const color = getUserColor(ev.owner_id)
                    return (
                      <div
                        key={ev.id}
                        className="text-[9px] leading-[13px] text-left rounded-sm px-1 overflow-hidden whitespace-nowrap"
                        style={ev.is_reminder
                          ? { backgroundColor: '#FAF7F2', color, border: `1px solid ${color}` }
                          : { backgroundColor: color, color: 'white' }
                        }
                      >
                        {ev.is_reminder ? '🔔 ' : ''}{ev.title}
                      </div>
                    )
                  })}
                  {dayEvents.length > 3 && (
                    <p className="text-[8px] text-moss-light pl-0.5">+{dayEvents.length - 3}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* 複数日イベントオーバーレイ（pointer-events-none でセル選択を妨げない） */}
        <div className="absolute inset-0 pointer-events-none">
          {multiDaySegments.map((seg, i) => {
            const top = seg.row * CELL_H + BAR_OFFSET + seg.lane * (BAR_H + BAR_GAP)
            const leftPct = (seg.colStart / 7) * 100
            const widthPct = ((seg.colEnd - seg.colStart + 1) / 7) * 100
            const color = getUserColor(seg.ev.owner_id)
            const rLeft = seg.isStart ? 3 : 0
            const rRight = seg.isEnd ? 3 : 0
            const isReminder = seg.ev.is_reminder

            return (
              <div
                key={`${seg.ev.id}-${i}`}
                className="absolute text-[9px] leading-[13px] text-left overflow-hidden whitespace-nowrap"
                style={{
                  top,
                  left: `calc(${leftPct}% + ${seg.isStart ? 2 : 0}px)`,
                  width: `calc(${widthPct}% - ${seg.isStart ? 2 : 0}px - ${seg.isEnd ? 2 : 0}px)`,
                  height: BAR_H,
                  backgroundColor: isReminder ? '#FAF7F2' : color,
                  color: isReminder ? color : 'white',
                  border: isReminder ? `1px solid ${color}` : 'none',
                  borderRadius: `${rLeft}px ${rRight}px ${rRight}px ${rLeft}px`,
                  paddingLeft: seg.isStart ? 4 : 2,
                }}
              >
                {seg.isStart ? (isReminder ? `🔔 ${seg.ev.title}` : seg.ev.title) : '\u00A0'}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
