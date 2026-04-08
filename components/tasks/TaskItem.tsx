'use client'

import { useState } from 'react'
import type { Task, User } from '@/lib/types'

type Props = {
  task: Task
  users: User[]
  currentUserId: string
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
  onDelete: (taskId: string) => void
  onReorder?: (task: Task, direction: 'up' | 'down') => void
  isFirst?: boolean
  isLast?: boolean
}

export default function TaskItem({ task, users, currentUserId, onEdit, onToggle, onDelete, onReorder, isFirst, isLast }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const assignee = users.find(u => u.id === task.assignee_id)

  return (
    <div className={`border-b border-fog/40 last:border-0 ${task.is_done ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 py-3 px-1">
        {/* チェックボックス */}
        <button
          onClick={() => onToggle(task)}
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
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-shared-bg text-shared">両方</span>
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

        {/* 並び替えボタン */}
        {!task.is_done && onReorder && (
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button
              onClick={() => onReorder(task, 'up')}
              disabled={isFirst}
              className="p-0.5 text-fog hover:text-moss-light transition disabled:opacity-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button
              onClick={() => onReorder(task, 'down')}
              disabled={isLast}
              className="p-0.5 text-fog hover:text-moss-light transition disabled:opacity-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        )}

        {/* 削除ボタン */}
        <button
          onClick={() => setConfirmDelete(true)}
          className="p-1 text-fog hover:text-red-400 transition flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      {/* 削除確認 */}
      {confirmDelete && (
        <div className="flex items-center justify-between px-3 py-2 bg-red-50 text-sm">
          <span className="text-red-500">削除しますか？</span>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1 rounded-lg bg-white border border-fog text-charcoal text-xs hover:bg-sand transition"
            >
              キャンセル
            </button>
            <button
              onClick={() => { setConfirmDelete(false); onDelete(task.id) }}
              className="px-3 py-1 rounded-lg bg-red-400 text-white text-xs hover:bg-red-500 transition"
            >
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
