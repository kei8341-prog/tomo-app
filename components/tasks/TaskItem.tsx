'use client'

import type { Task, User } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

type Props = {
  task: Task
  users: User[]
  currentUserId: string
  onEdit: (task: Task) => void
}

const ICON_MAP: Record<string, string> = {
  cart: '🛒', check: '✓', wrench: '🔧', leaf: '🌿', home: '🏠',
  repeat: '🔁', book: '📚', star: '⭐', coin: '💰', heart: '❤️', map: '📍', gift: '🎁',
}

export default function TaskItem({ task, users, currentUserId, onEdit }: Props) {
  const supabase = createClient()
  const assignee = users.find(u => u.id === task.assignee_id)

  async function toggleDone() {
    await supabase.from('tasks').update({
      is_done: !task.is_done,
      done_at: task.is_done ? null : new Date().toISOString(),
    }).eq('id', task.id)
  }

  return (
    <div
      className={`flex items-center gap-3 py-3 px-1 border-b border-fog/40 last:border-0 ${
        task.is_done ? 'opacity-50' : ''
      }`}
    >
      {/* チェックボックス */}
      <button
        onClick={toggleDone}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
          task.is_done ? 'border-moss bg-moss' : 'border-fog'
        }`}
      >
        {task.is_done && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </button>

      {/* タスク情報 */}
      <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
        <p className={`text-sm text-charcoal truncate ${task.is_done ? 'line-through' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.assignee_id === null ? (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-shared-bg text-shared">
              両方
            </span>
          ) : assignee ? (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: assignee.color + '30', color: assignee.color }}
            >
              {assignee.display_name}
            </span>
          ) : null}
          {task.due_date && (
            <span className="text-xs text-moss-light">{task.due_date}</span>
          )}
          {task.is_recurring && task.base_amount != null && (
            <span className="text-xs text-bark">¥{task.base_amount.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  )
}
