'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const GOLD   = '#B8922A'
const MUTED  = '#8A7D6E'

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? GOLD : MUTED} strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="1" />
      <line x1="3"  y1="9"  x2="21" y2="9" />
      <line x1="8"  y1="2"  x2="8"  y2="6" />
      <line x1="16" y1="2"  x2="16" y2="6" />
    </svg>
  )
}

function TasksIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? GOLD : MUTED} strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="8"  y1="9"  x2="16" y2="9" />
      <line x1="8"  y1="13" x2="16" y2="13" />
      <line x1="8"  y1="17" x2="12" y2="17" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? GOLD : MUTED} strokeWidth="1.2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  )
}

const items = [
  { href: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { href: '/tasks',    label: 'Tasks',    Icon: TasksIcon    },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-cream border-t border-fog flex items-stretch h-16 z-40">
      {items.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative transition"
          >
            {/* thin gold indicator line at top when active */}
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-px bg-moss" />
            )}
            <Icon active={active} />
            <span
              className={`text-[8.5px] tracking-widest uppercase transition ${
                active ? 'text-moss' : 'text-bark/60'
              }`}
              style={{ fontFamily: 'inherit', fontWeight: 400 }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
