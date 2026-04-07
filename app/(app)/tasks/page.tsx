'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import GroupCard from '@/components/tasks/GroupCard'
import TaskSheet from '@/components/tasks/TaskSheet'
import Sheet from '@/components/ui/Sheet'
import type { Task, TaskGroup, User, IconKey } from '@/lib/types'

const ICON_OPTIONS: { key: IconKey; label: string }[] = [
  { key: 'cart', label: '🛒 買い物' },
  { key: 'check', label: '✓ やること' },
  { key: 'wrench', label: '🔧 修理・作業' },
  { key: 'leaf', label: '🌿 自然・趣味' },
  { key: 'home', label: '🏠 家のこと' },
  { key: 'repeat', label: '🔁 定期' },
  { key: 'book', label: '📚 学習' },
  { key: 'star', label: '⭐ 重要' },
  { key: 'coin', label: '💰 お金' },
  { key: 'heart', label: '❤️ 健康' },
  { key: 'map', label: '📍 お出かけ' },
  { key: 'gift', label: '🎁 イベント' },
]

export default function TasksPage() {
  const supabase = createClient()

  const [tasks, setTasks] = useState<Task[]>([])
  const [groups, setGroups] = useState<TaskGroup[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [coupleId, setCoupleId] = useState('')

  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultGroupId, setDefaultGroupId] = useState<string | undefined>()

  const [groupSheetOpen, setGroupSheetOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupIcon, setGroupIcon] = useState<IconKey>('check')
  const [groupColor, setGroupColor] = useState('#6B7D72')
  const [savingGroup, setSavingGroup] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (!userData) return
      setCurrentUser(userData)
      setCoupleId(userData.couple_id)

      const { data: coupleUsers } = await supabase.from('users').select('*').eq('couple_id', userData.couple_id)
      setUsers(coupleUsers ?? [])
    }
    init()
  }, [])

  const fetchData = useCallback(async () => {
    if (!coupleId) return
    const [{ data: g }, { data: t }] = await Promise.all([
      supabase.from('task_groups').select('*').eq('couple_id', coupleId).order('sort_order'),
      supabase.from('tasks').select('*').eq('couple_id', coupleId).order('sort_order'),
    ])
    setGroups(g ?? [])
    setTasks(t ?? [])
  }, [coupleId])

  useEffect(() => { fetchData() }, [fetchData])

  // リアルタイム同期
  useEffect(() => {
    if (!coupleId) return
    const ch = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `couple_id=eq.${coupleId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_groups', filter: `couple_id=eq.${coupleId}` }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [coupleId, fetchData])

  async function handleDeleteGroup(group: TaskGroup) {
    const hasTask = tasks.some(t => t.group_id === group.id)
    if (hasTask) {
      alert('タスクを先に削除してください')
      return
    }
    await supabase.from('task_groups').delete().eq('id', group.id)
  }

  async function handleSaveGroup() {
    if (!groupName.trim()) return
    setSavingGroup(true)
    const maxOrder = groups.reduce((m, g) => Math.max(m, g.sort_order), 0)
    await supabase.from('task_groups').insert({
      couple_id: coupleId,
      name: groupName,
      icon_key: groupIcon,
      color: groupColor,
      sort_order: maxOrder + 1,
    })
    setSavingGroup(false)
    setGroupSheetOpen(false)
    setGroupName('')
    setGroupIcon('check')
    setGroupColor('#6B7D72')
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen text-moss-light">読み込み中...</div>
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-2xl text-charcoal">タスク</h2>
        <button
          onClick={() => setGroupSheetOpen(true)}
          className="text-sm text-moss border border-moss rounded-xl px-3 py-1.5 hover:bg-moss-pale transition"
        >
          + グループ
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-fog text-sm">
          <p>グループがありません</p>
          <p className="mt-1">右上から作成してください</p>
        </div>
      ) : (
        groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            tasks={tasks.filter(t => t.group_id === group.id)}
            users={users}
            currentUserId={currentUser.id}
            onAddTask={gid => { setDefaultGroupId(gid); setEditingTask(null); setTaskSheetOpen(true) }}
            onEditTask={task => { setEditingTask(task); setDefaultGroupId(undefined); setTaskSheetOpen(true) }}
            onDeleteGroup={handleDeleteGroup}
          />
        ))
      )}

      {/* タスクシート */}
      <TaskSheet
        open={taskSheetOpen}
        onClose={() => { setTaskSheetOpen(false); setEditingTask(null) }}
        task={editingTask}
        defaultGroupId={defaultGroupId}
        currentUser={currentUser}
        users={users}
        groups={groups}
        coupleId={coupleId}
        nextSortOrder={tasks.length}
      />

      {/* グループ作成シート */}
      <Sheet open={groupSheetOpen} onClose={() => setGroupSheetOpen(false)} title="グループを作成">
        <div className="space-y-4 pb-6">
          <div>
            <label className="block text-sm text-bark mb-1">グループ名</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-fog text-charcoal focus:outline-none focus:border-moss transition"
              placeholder="例：買い物リスト"
            />
          </div>

          <div>
            <label className="block text-sm text-bark mb-2">アイコン</label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setGroupIcon(key)}
                  className={`py-2 rounded-xl text-sm transition border ${
                    groupIcon === key ? 'border-moss bg-moss-pale' : 'border-fog bg-white'
                  }`}
                >
                  {label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-bark mb-2">カラー</label>
            <div className="flex gap-2 flex-wrap">
              {['#6B7D72', '#C4896A', '#6B8F7A', '#7A8FA8', '#5A4E3C', '#4A5C50'].map(c => (
                <button
                  key={c}
                  onClick={() => setGroupColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    groupColor === c ? 'border-charcoal scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveGroup}
            disabled={savingGroup || !groupName.trim()}
            className="w-full py-3 bg-moss text-cream rounded-xl font-medium hover:bg-moss-light transition disabled:opacity-50"
          >
            {savingGroup ? '作成中...' : '作成する'}
          </button>
        </div>
      </Sheet>
    </div>
  )
}
