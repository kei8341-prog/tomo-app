'use client'

import { useState, useEffect } from 'react'
import Sheet from '@/components/ui/Sheet'
import { createClient } from '@/lib/supabase/client'
import type { Event, User } from '@/lib/types'

// 時刻入力コンポーネント（数字キーで入力できるよう時・分を分割）
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = value.match(/^(\d{1,2}):(\d{2})$/)
  const hour = parts ? parseInt(parts[1]) : 0
  const minute = parts ? parseInt(parts[2]) : 0

  function update(h: number, m: number) {
    const hh = String(Math.min(23, Math.max(0, isNaN(h) ? 0 : h))).padStart(2, '0')
    const mm = String(Math.min(59, Math.max(0, isNaN(m) ? 0 : m))).padStart(2, '0')
    onChange(`${hh}:${mm}`)
  }

  return (
    <div className="flex items-center justify-center gap-0.5 w-full px-2 py-2.5 rounded-xl bg-white border border-fog focus-within:border-moss transition">
      <input
        type="number"
        inputMode="numeric"
        min={0} max={23}
        value={hour}
        onChange={e => update(parseInt(e.target.value), minute)}
        className="w-10 text-center text-sm text-charcoal bg-transparent focus:outline-none"
      />
      <span className="text-charcoal font-medium text-sm select-none">:</span>
      <input
        type="number"
        inputMode="numeric"
        min={0} max={59} step={5}
        value={minute}
        onChange={e => update(hour, parseInt(e.target.value))}
        className="w-10 text-center text-sm text-charcoal bg-transparent focus:outline-none"
      />
    </div>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  event?: Event | null
  defaultDate?: string
  currentUser: User
  users: User[]
  coupleId: string
}

export default function EventSheet({ open, onClose, onSaved, event, defaultDate, currentUser, users, coupleId }: Props) {
  const supabase = createClient()
  const isEdit = !!event

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [isAllDay, setIsAllDay] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [isReminder, setIsReminder] = useState(false)
  const [ownerId, setOwnerId] = useState<string | null>(currentUser.id)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      const sd = event.start_at.slice(0, 10)
      setStartDate(sd)
      setEndDate(event.end_at ? event.end_at.slice(0, 10) : sd)
      setIsAllDay(event.is_all_day)
      setStartTime(event.start_at.slice(11, 16))
      setEndTime(event.end_at ? event.end_at.slice(11, 16) : '10:00')
      setOwnerId(event.owner_id)
      setIsYearly(event.is_yearly)
      setIsReminder(event.is_reminder)
      setMemo(event.memo ?? '')
    } else {
      setTitle('')
      setStartDate(defaultDate ?? '')
      setEndDate(defaultDate ?? '')
      setIsAllDay(false)
      setIsYearly(false)
      setIsReminder(false)
      setStartTime('09:00')
      setEndTime('10:00')
      setOwnerId(currentUser.id)
      setMemo('')
    }
  }, [event, defaultDate, currentUser.id])

  // startDate が変わったとき endDate が前になっていたら合わせる
  function handleStartDateChange(val: string) {
    setStartDate(val)
    if (endDate < val) setEndDate(val)
  }

  async function handleSave() {
    if (!title.trim() || !startDate) return
    setSaving(true)

    const start_at = isAllDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`
    let end_at: string | null
    if (isAllDay) {
      end_at = startDate !== endDate ? `${endDate}T00:00:00` : null
    } else {
      end_at = `${endDate}T${endTime}:00`
    }

    if (isEdit && event) {
      await supabase.from('events').update({
        title, start_at, end_at,
        is_all_day: isAllDay, is_yearly: isYearly, is_reminder: isReminder,
        owner_id: ownerId, memo: memo || null,
      }).eq('id', event.id)
    } else {
      await supabase.from('events').insert({
        couple_id: coupleId,
        owner_id: ownerId,
        created_by: currentUser.id,
        title, start_at, end_at,
        is_all_day: isAllDay, is_yearly: isYearly, is_reminder: isReminder,
        memo: memo || null,
      })
    }

    setSaving(false)
    onSaved?.()
    onClose()
  }

  async function handleDelete() {
    if (!event) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', event.id)
    setDeleting(false)
    onSaved?.()
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? '予定を編集' : '予定を追加'}>
      <div className="space-y-4 pb-6">
        <div>
          <label className="block text-sm text-bark mb-1">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
            placeholder="例：病院の予約"
          />
        </div>

        {/* 種類（予定 / リマインド） */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsReminder(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
              !isReminder ? 'border-transparent bg-moss text-cream' : 'border-fog bg-white text-charcoal'
            }`}
          >
            予定
          </button>
          <button
            onClick={() => setIsReminder(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
              isReminder ? 'border-transparent bg-shared text-cream' : 'border-fog bg-white text-charcoal'
            }`}
          >
            🔔 リマインド
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-sm text-bark mb-1">開始日</label>
            <input
              type="date"
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
              className="w-full px-2 py-2.5 rounded-xl bg-white border border-fog text-charcoal text-sm focus:outline-none focus:border-moss transition"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm text-bark mb-1">終了日</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-2 py-2.5 rounded-xl bg-white border border-fog text-charcoal text-sm focus:outline-none focus:border-moss transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="allday"
            checked={isAllDay}
            onChange={e => setIsAllDay(e.target.checked)}
            className="accent-moss"
          />
          <label htmlFor="allday" className="text-sm text-charcoal">終日</label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="yearly"
            checked={isYearly}
            onChange={e => setIsYearly(e.target.checked)}
            className="accent-moss"
          />
          <label htmlFor="yearly" className="text-sm text-charcoal">毎年繰り返す</label>
        </div>

        {!isAllDay && (
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-bark mb-1">開始時刻</label>
              <TimeInput value={startTime} onChange={setStartTime} />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-bark mb-1">終了時刻</label>
              <TimeInput value={endTime} onChange={setEndTime} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-bark mb-1">担当者</label>
          <div className="flex gap-2">
            <button
              onClick={() => setOwnerId(null)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                ownerId === null ? 'border-transparent bg-shared text-cream' : 'border-fog bg-white text-charcoal'
              }`}
            >
              両方
            </button>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setOwnerId(u.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                  ownerId === u.id ? 'border-transparent' : 'border-fog bg-white text-charcoal'
                }`}
                style={ownerId === u.id ? { backgroundColor: u.color, color: '#FAF7F2' } : {}}
              >
                {u.display_name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-bark mb-1">メモ</label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition resize-none"
            placeholder="メモ（任意）"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="w-full py-3 bg-moss text-cream rounded-xl font-medium hover:bg-moss-light transition disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存する'}
        </button>

        {isEdit && event?.created_by === currentUser.id && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 text-red-400 text-sm hover:text-red-600 transition disabled:opacity-50"
          >
            {deleting ? '削除中...' : 'この予定を削除する'}
          </button>
        )}
      </div>
    </Sheet>
  )
}
