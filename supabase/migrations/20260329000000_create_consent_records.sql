-- Migration: create consent_records table
-- Requirements: 12.1, 12.2, 12.4

create table if not exists consent_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  decision      text not null check (decision in ('agreed', 'skipped', 'withdrawn')),
  consented_at  timestamptz not null,
  withdrawn_at  timestamptz,
  app_version   text not null,
  unique (user_id)
);

-- Row Level Security
alter table consent_records enable row level security;

create policy "Users can select their own consent record"
  on consent_records for select
  using (auth.uid() = user_id);

create policy "Users can insert their own consent record"
  on consent_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own consent record"
  on consent_records for update
  using (auth.uid() = user_id);
