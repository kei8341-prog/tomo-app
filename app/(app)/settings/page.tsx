'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@/lib/types'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) { setCurrentUser(data); setDisplayName(data.display_name) }
    }
    load()
  }, [])

  async function handleSaveName() {
    if (!currentUser || !displayName.trim()) return
    setSaving(true)
    await supabase.from('users').update({ display_name: displayName }).eq('id', currentUser.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen text-moss-light">読み込み中...</div>
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h2 className="font-heading text-2xl text-charcoal mb-6">設定</h2>

      {/* プロフィール */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h3 className="text-sm font-medium text-bark mb-4">プロフィール</h3>

        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-cream font-heading text-xl"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.display_name.slice(0, 1)}
          </div>
          <div>
            <p className="text-sm text-charcoal font-medium">{currentUser.display_name}</p>
            <p className="text-xs text-moss-light">{currentUser.role === 'partner_1' ? 'パートナー1' : 'パートナー2'}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-bark mb-1">表示名</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream border border-fog text-charcoal focus:outline-none focus:border-moss transition"
              placeholder="表示名"
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !displayName.trim()}
              className="px-4 py-2.5 bg-moss text-cream rounded-xl text-sm font-medium hover:bg-moss-light transition disabled:opacity-50"
            >
              {saved ? '✓' : saving ? '...' : '保存'}
            </button>
          </div>
        </div>
      </div>

      {/* アカウント */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-medium text-bark mb-4">アカウント</h3>
        <button
          onClick={handleLogout}
          className="w-full py-3 text-red-400 border border-red-200 rounded-xl text-sm hover:bg-red-50 transition"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
