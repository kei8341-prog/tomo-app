'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="relative bg-cream max-h-[90vh] flex flex-col border-t border-fog shadow-xl">
        {/* handle — thin line */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-px bg-fog" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-fog">
          <h2 className="font-heading text-xl italic tracking-wide text-charcoal">{title}</h2>
          <button
            onClick={onClose}
            className="text-fog hover:text-charcoal transition p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={1.2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
