'use client'

import { useState } from 'react'
import type { Task, TaskGroup, User } from '@/lib/types'
import TaskItem from './TaskItem'

type Props = {
  group: TaskGroup
  tasks: Task[]
  users: User[]
  currentUserId: string
  onAddTask: (groupId: string) => void
  onEditTask: (task: Task) => void
  onToggleTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onEditGroup: (group: TaskGroup) => void
  onDeleteGroup: (group: TaskGroup) => void
  onReorder: (task: Task, direction: 'up' | 'down') => void
}

const ICON_MAP: Record<string, string> = {
  cart: '🛒', check: '✓', wrench: '🔧', leaf: '🌿', home: '🏠',
  repeat: '🔁', book: '📚', star: '⭐', coin: '💰', heart: '❤️', map: '📍', gift: '🎁',
}

export default function GroupCard({ group, tasks, users, currentUserId, onAddTask, onEditTask, onToggleTask, onDeleteTask, onEditGroup, onDeleteGroup, onReorder }: Props) {
  const [expanded, setExpanded] = useState(true)

  const doneTasks = tasks.filter(t => t.is_done)
  const pendingTasks = tasks.filter(t => !t.is_done)
  const ordered = [...pendingTasks, ...doneTasks]

  return (
    <div className="bg-white overflow-hidden mb-4 border-t border-fog">
      {/* グループヘッダー */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-sand hover:bg-sand-mid transition border-b border-fog"
      >
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: group.color + '30', color: group.color }}
        >
          {ICON_MAP[group.icon_key] ?? '📌'}
        </span>
        <span className="flex-1 text-left text-sm font-medium text-charcoal">{group.name}</span>
        <span className="text-xs text-moss-light">{pendingTasks.length}件</span>
        <span
          role="button"
          onClick={e => { e.stopPropagation(); onEditGroup(group) }}
          className="p-1 text-fog hover:text-moss-light transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={`w-4 h-4 text-fog transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-2">
          {ordered.map((task, idx) => (
            <TaskItem
              key={task.id}
              task={task}
              users={users}
              currentUserId={currentUserId}
              onEdit={onEditTask}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onReorder={onReorder}
              isFirst={idx === 0}
              isLast={idx === pendingTasks.length - 1}
            />
          ))}

          <div className="flex items-center justify-between mt-2 pt-2">
            <button
              onClick={() => onAddTask(group.id)}
              className="flex items-center gap-1 text-sm text-moss hover:text-moss-light transition"
            >
              <span className="text-lg leading-none">+</span>
              <span>タスクを追加</span>
            </button>

            {tasks.length === 0 && (
              <button
                onClick={() => onDeleteGroup(group)}
                className="text-xs text-fog hover:text-red-400 transition"
              >
                グループを削除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
