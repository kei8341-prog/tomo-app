'use client'

import { useState, useEffect } from 'react'
import Sheet from '@/components/ui/Sheet'
import { createClient } from '@/lib/supabase/client'
import type { Event, User } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  event?: Event | null
  defaultDate?: string
  currentUser: User
  users: User[]
  coupleId: string
}

export default function EventSheet({ open, onClose, event, defaultDate, currentUser, users, coupleId }: Props) {
  const supabase = createClient()
  const isEdit = !!event

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [isAllDay, setIsAllDay] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
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
      setMemo(event.memo ?? '')
    } else {
      setTitle('')
      setStartDate(defaultDate ?? '')
      setEndDate(defaultDate ?? '')
      setIsAllDay(false)
      setIsYearly(false)
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
        is_all_day: isAllDay, is_yearly: isYearly,
        owner_id: ownerId, memo: memo || null,
      }).eq('id', event.id)
    } else {
      await supabase.from('events').insert({
        couple_id: coupleId,
        owner_id: ownerId,
        created_by: currentUser.id,
        title, start_at, end_at,
        is_all_day: isAllDay, is_yearly: isYearly,
        memo: memo || null,
      })
    }

    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!event) return
    setDeleting(true)
    await supabase.from('events').delete().eq('id', event.id)
    setDeleting(false)
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

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-bark mb-1">開始日</label>
            <input
              type="date"
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-bark mb-1">終了日</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
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
          <label htmlFor="yearly" className="text-sm text-charcoal">毎年繰り返す（誕生日・記念日など）</label>
        </div>

        {!isAllDay && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-bark mb-1">開始時刻</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-bark mb-1">終了時刻</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
              />
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
