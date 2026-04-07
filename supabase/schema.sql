-- ============================================================
-- Tomo アプリ テーブル定義 + RLS ポリシー
-- Supabase の SQL Editor に貼り付けて実行してください
-- ============================================================

-- couples テーブル
create table couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- users テーブル（Supabase Auth の uid と紐づける）
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  display_name text not null,
  color text not null default '#6B7D72',
  role text not null check (role in ('partner_1', 'partner_2')),
  created_at timestamptz not null default now()
);

-- task_groups テーブル
create table task_groups (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  name text not null,
  icon_key text not null default 'check',
  color text not null default '#6B7D72',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- tasks テーブル
create table tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  group_id uuid not null references task_groups(id) on delete cascade,
  assignee_id uuid not null references users(id),
  created_by uuid not null references users(id),
  title text not null,
  due_date date,
  is_done boolean not null default false,
  done_at timestamptz,
  is_recurring boolean not null default false,
  recurring_day integer check (recurring_day between 1 and 31),
  base_amount integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- recurring_overrides テーブル
create table recurring_overrides (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  target_month text not null,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique (task_id, target_month)
);

-- events テーブル
create table events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  owner_id uuid not null references users(id),
  created_by uuid not null references users(id),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  is_all_day boolean not null default false,
  memo text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS を有効化
-- ============================================================
alter table couples enable row level security;
alter table users enable row level security;
alter table task_groups enable row level security;
alter table tasks enable row level security;
alter table recurring_overrides enable row level security;
alter table events enable row level security;

-- ============================================================
-- couples ポリシー
-- ============================================================
create policy "自分のcoupleのみ参照" on couples
  for select using (
    id in (select couple_id from users where id = auth.uid())
  );

-- ============================================================
-- users ポリシー
-- ============================================================
create policy "同じcoupleのuserを参照" on users
  for select using (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "自分のプロフィールのみ更新" on users
  for update using (id = auth.uid());

-- ============================================================
-- task_groups ポリシー
-- ============================================================
create policy "同じcoupleのグループを参照" on task_groups
  for select using (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "同じcoupleにグループを作成" on task_groups
  for insert with check (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "同じcoupleのグループを更新" on task_groups
  for update using (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "同じcoupleのグループを削除" on task_groups
  for delete using (
    couple_id in (select couple_id from users where id = auth.uid())
  );

-- ============================================================
-- tasks ポリシー
-- ============================================================
create policy "同じcoupleのタスクを参照" on tasks
  for select using (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "同じcoupleにタスクを作成" on tasks
  for insert with check (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "同じcoupleのタスクを更新" on tasks
  for update using (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "作成者のみタスクを削除" on tasks
  for delete using (created_by = auth.uid());

-- ============================================================
-- recurring_overrides ポリシー
-- ============================================================
create policy "同じcoupleの上書きを参照" on recurring_overrides
  for select using (
    task_id in (
      select id from tasks where couple_id in (
        select couple_id from users where id = auth.uid()
      )
    )
  );

create policy "同じcoupleに上書きを作成" on recurring_overrides
  for insert with check (
    task_id in (
      select id from tasks where couple_id in (
        select couple_id from users where id = auth.uid()
      )
    )
  );

create policy "同じcoupleの上書きを更新" on recurring_overrides
  for update using (
    task_id in (
      select id from tasks where couple_id in (
        select couple_id from users where id = auth.uid()
      )
    )
  );

create policy "同じcoupleの上書きを削除" on recurring_overrides
  for delete using (
    task_id in (
      select id from tasks where couple_id in (
        select couple_id from users where id = auth.uid()
      )
    )
  );

-- ============================================================
-- events ポリシー
-- ============================================================
create policy "同じcoupleの予定を参照" on events
  for select using (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "同じcoupleに予定を作成" on events
  for insert with check (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "同じcoupleの予定を更新" on events
  for update using (
    couple_id in (select couple_id from users where id = auth.uid())
  );

create policy "作成者のみ予定を削除" on events
  for delete using (created_by = auth.uid());

-- ============================================================
-- Realtime を有効化
-- ============================================================
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_groups;
