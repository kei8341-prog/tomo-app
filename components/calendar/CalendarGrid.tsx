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

// Layout constants (px)
const CELL_H = 96       // h-24
const DATE_H = 30       // 日付数字エリア高さ (pt-1 + h-6 + mb-0.5)
const BAR_H = 13        // イベントバー高さ
const BAR_GAP = 2       // バー間隔
const BAR_OFFSET = DATE_H + 2 // 複数日バー開始Y（セル内）

export default function CalendarGrid({
  year, month, events, users, currentUserId, selectedDate, onSelectDate
}: Props) {
  const firstDay = useMemo(() => new Date(year, month, 1).getDay(), [year, month])
  const lastDate = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])

  const days = useMemo(() => {
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: lastDate }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [firstDay, lastDate])

  const holidaySet = useMemo(() => {
    const set = new Set<string>()
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(year, month, d)
      if (HolidayJP.isHoliday(date)) {
        set.add(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      }
    }
    return set
  }, [year, month, lastDate])

  function getUserColor(ownerId: string | null) {
    if (ownerId === null) return '#7A8FA8'
    return users.find(u => u.id === ownerId)?.color ?? '#7A8FA8'
  }

  function toDateStr(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
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

  // 単日イベント（複数日イベントを除く）
  const singleDayByDate = useMemo(() => {
    const multiIds = new Set(
      events
        .filter(ev => (ev.end_at?.slice(0, 10) ?? ev.start_at.slice(0, 10)) > ev.start_at.slice(0, 10))
        .map(ev => ev.id)
    )
    const map: Record<string, Event[]> = {}
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = toDateStr(d)
      const dayEvents = events.filter(ev => !multiIds.has(ev.id) && ev.start_at.slice(0, 10) === dateStr)
      if (dayEvents.length > 0) map[dateStr] = dayEvents
    }
    return map
  }, [events, lastDate, year, month])

  const totalRows = days.length / 7

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

      {/* グリッド + 複数日バーオーバーレイ */}
      <div className="relative border-t border-fog/50">
        {/* 日付セルグリッド */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-24 border-b border-r border-fog/30" />
            }
            const dateStr = toDateStr(day)
            const dayEvents = singleDayByDate[dateStr] ?? []
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const dow = idx % 7
            const isHoliday = holidaySet.has(dateStr)
            const isSundayColor = dow === 0 || isHoliday

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
                </div>
                {/* 単日イベント（複数日バーの直下に配置） */}
                <div className="w-full space-y-0.5 px-0.5 mt-[18px]">
                  {dayEvents.slice(0, 1).map(ev => (
                    <div
                      key={ev.id}
                      className="text-[9px] leading-[13px] text-left text-white rounded-sm px-1 overflow-hidden whitespace-nowrap"
                      style={{ backgroundColor: getUserColor(ev.owner_id) }}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 1 && (
                    <p className="text-[8px] text-moss-light pl-0.5">+{dayEvents.length - 1}</p>
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

            return (
              <div
                key={`${seg.ev.id}-${i}`}
                className="absolute text-[9px] leading-[13px] text-left text-white overflow-hidden whitespace-nowrap"
                style={{
                  top,
                  left: `calc(${leftPct}% + ${seg.isStart ? 2 : 0}px)`,
                  width: `calc(${widthPct}% - ${seg.isStart ? 2 : 0}px - ${seg.isEnd ? 2 : 0}px)`,
                  height: BAR_H,
                  backgroundColor: color,
                  borderRadius: `${rLeft}px ${rRight}px ${rRight}px ${rLeft}px`,
                  paddingLeft: seg.isStart ? 4 : 2,
                }}
              >
                {seg.isStart ? seg.ev.title : '\u00A0'}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
