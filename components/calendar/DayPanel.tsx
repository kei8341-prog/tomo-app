'use client'

import type { Event, User } from '@/lib/types'

type Props = {
  date: string
  events: Event[]
  users: User[]
  currentUserId: string
  onAddEvent: () => void
  onEditEvent: (event: Event) => void
}

function formatTime(dateStr: string, isAllDay: boolean) {
  if (isAllDay) return '終日'
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日（${dow}）`
}

export default function DayPanel({ date, events, users, currentUserId, onAddEvent, onEditEvent }: Props) {
  function getUserInfo(id: string | null) {
    if (id === null) return undefined
    return users.find(u => u.id === id)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-lg text-charcoal">{formatDateLabel(date)}</h3>
        <button
          onClick={onAddEvent}
          className="w-8 h-8 bg-moss text-cream rounded-full flex items-center justify-center hover:bg-moss-light transition text-lg leading-none"
        >
          +
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-fog text-sm text-center py-4">予定はありません</p>
      ) : (
        <ul className="space-y-2">
          {events.map(ev => {
            const owner = getUserInfo(ev.owner_id)
            return (
              <li
                key={ev.id}
                onClick={() => onEditEvent(ev)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-sand/50 cursor-pointer transition"
                style={{ borderLeft: `3px solid ${owner?.color ?? '#7A8FA8'}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-charcoal truncate">{ev.title}</p>
                    {ev.is_yearly && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-moss-pale text-moss flex-shrink-0">毎年</span>
                    )}
                  </div>
                  <p className="text-xs text-moss-light mt-0.5">
                    {formatTime(ev.start_at, ev.is_all_day)}
                    {ev.end_at && !ev.is_all_day && ev.start_at.slice(0, 10) === ev.end_at.slice(0, 10) && ` → ${formatTime(ev.end_at, false)}`}
                    {ev.end_at && ev.start_at.slice(0, 10) !== ev.end_at.slice(0, 10) && (
                      <span className="ml-1">〜{ev.end_at.slice(5, 10).replace('-', '/')}まで</span>
                    )}
                    {ev.owner_id === null ? (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-shared-bg text-shared text-xs">両方</span>
                    ) : owner ? (
                      <span className="ml-2">{owner.display_name}</span>
                    ) : null}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
