export type Role = 'partner_1' | 'partner_2'

export type User = {
  id: string
  couple_id: string
  display_name: string
  color: string
  role: Role
  created_at: string
}

export type Couple = {
  id: string
  created_at: string
}

export type Event = {
  id: string
  couple_id: string
  owner_id: string
  created_by: string
  title: string
  start_at: string
  end_at: string | null
  is_all_day: boolean
  memo: string | null
  created_at: string
}

export type TaskGroup = {
  id: string
  couple_id: string
  name: string
  icon_key: IconKey
  color: string
  sort_order: number
  created_at: string
}

export type IconKey =
  | 'cart' | 'check' | 'wrench' | 'leaf' | 'home'
  | 'repeat' | 'book' | 'star' | 'coin' | 'heart' | 'map' | 'gift'

export type Task = {
  id: string
  couple_id: string
  group_id: string
  assignee_id: string
  created_by: string
  title: string
  due_date: string | null
  is_done: boolean
  done_at: string | null
  is_recurring: boolean
  recurring_day: number | null
  base_amount: number | null
  sort_order: number
  created_at: string
}

export type RecurringOverride = {
  id: string
  task_id: string
  target_month: string
  amount: number
  created_at: string
}

export type TaskWithGroup = Task & {
  task_groups: TaskGroup
}
