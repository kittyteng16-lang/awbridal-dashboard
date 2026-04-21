-- 看板数据缓存表
-- 每个 section 只保存一行，upsert 更新

create table if not exists dashboard_cache (
  id          uuid        primary key default gen_random_uuid(),
  section     text        not null,
  data        jsonb       not null,
  fetched_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '6 hours')
);

-- section 唯一索引（upsert on conflict 使用）
create unique index if not exists dashboard_cache_section_idx on dashboard_cache (section);

-- 自动清理过期行（可选，配合 pg_cron 使用）
-- select cron.schedule('cleanup-dashboard-cache', '0 3 * * *',
--   $$delete from dashboard_cache where expires_at < now() - interval '1 day'$$);

-- RLS：只允许 service_role 写，anon 不可直接访问
alter table dashboard_cache enable row level security;

create policy "service_role only" on dashboard_cache
  for all using (auth.role() = 'service_role');
