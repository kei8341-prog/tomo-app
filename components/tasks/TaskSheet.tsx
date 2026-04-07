'use client'

import { useState, useEffect } from 'react'
import Sheet from '@/components/ui/Sheet'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskGroup, User } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultGroupId?: string
  currentUser: User
  users: User[]
  groups: TaskGroup[]
  coupleId: string
  nextSortOrder: number
}

export default function TaskSheet({ open, onClose, task, defaultGroupId, currentUser, users, groups, coupleId, nextSortOrder }: Props) {
  const supabase = createClient()
  const isEdit = !!task

  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? '')
  const [assigneeId, setAssigneeId] = useState<string | null>(currentUser.id)
  const [dueDate, setDueDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDay, setRecurringDay] = useState<number>(1)
  const [baseAmount, setBaseAmount] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setGroupId(task.group_id)
      setAssigneeId(task.assignee_id ?? null)
      setDueDate(task.due_date ?? '')
      setIsRecurring(task.is_recurring)
      setRecurringDay(task.recurring_day ?? 1)
      setBaseAmount(task.base_amount ?? '')
    } else {
      setTitle('')
      setGroupId(defaultGroupId ?? groups[0]?.id ?? '')
      setAssigneeId(currentUser.id)
      setDueDate('')
      setIsRecurring(false)
      setRecurringDay(1)
      setBaseAmount('')
    }
  }, [task, defaultGroupId, groups, currentUser.id])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)

    const payload = {
      title,
      group_id: groupId,
      assignee_id: assigneeId,
      due_date: dueDate || null,
      is_recurring: isRecurring,
      recurring_day: isRecurring ? recurringDay : null,
      base_amount: isRecurring && baseAmount !== '' ? Number(baseAmount) : null,
    }

    if (isEdit && task) {
      await supabase.from('tasks').update(payload).eq('id', task.id)
    } else {
      await supabase.from('tasks').insert({
        ...payload,
        couple_id: coupleId,
        created_by: currentUser.id,
        is_done: false,
        sort_order: nextSortOrder,
      })
    }

    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!task) return
    setDeleting(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    setDeleting(false)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? 'タスクを編集' : 'タスクを追加'}>
      <div className="space-y-4 pb-6">
        <div>
          <label className="block text-sm text-bark mb-1">タスク名</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
            placeholder="例：牛乳を買う"
          />
        </div>

        <div>
          <label className="block text-sm text-bark mb-1">グループ</label>
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-bark mb-1">担当者</label>
          <div className="flex gap-2">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setAssigneeId(u.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                  assigneeId === u.id ? 'border-transparent' : 'border-fog bg-white text-charcoal'
                }`}
                style={assigneeId === u.id ? { backgroundColor: u.color, color: '#FAF7F2' } : {}}
              >
                {u.display_name}
              </button>
            ))}
            <button
              onClick={() => setAssigneeId(null)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                assigneeId === null ? 'border-transparent bg-shared text-cream' : 'border-fog bg-white text-charcoal'
              }`}
            >
              両方
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={e => setIsRecurring(e.target.checked)}
            className="accent-moss"
          />
          <label htmlFor="recurring" className="text-sm text-charcoal">定期タスク（毎月）</label>
        </div>

        {isRecurring ? (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-bark mb-1">毎月何日</label>
              <input
                type="number"
                min={1} max={31}
                value={recurringDay}
                onChange={e => setRecurringDay(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-bark mb-1">基本金額（円）</label>
              <input
                type="number"
                min={0}
                value={baseAmount}
                onChange={e => setBaseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
                placeholder="任意"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-bark mb-1">期日</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="w-full py-3 bg-moss text-cream rounded-xl font-medium hover:bg-moss-light transition disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存する'}
        </button>

        {isEdit && task?.created_by === currentUser.id && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 text-red-400 text-sm hover:text-red-600 transition disabled:opacity-50"
          >
            {deleting ? '削除中...' : 'このタスクを削除する'}
          </button>
        )}
      </div>
    </Sheet>
  )
}
