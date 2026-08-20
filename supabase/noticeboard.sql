-- Run this once in Supabase SQL Editor to make Opslagstavlen shared between teachers.
create table if not exists public.noticeboard_posts (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 2000),
  author_email text not null,
  author_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.noticeboard_posts enable row level security;

drop policy if exists "Teachers can read noticeboard" on public.noticeboard_posts;
create policy "Teachers can read noticeboard"
on public.noticeboard_posts for select
to authenticated
using (true);

drop policy if exists "Teachers can create noticeboard posts" on public.noticeboard_posts;
create policy "Teachers can create noticeboard posts"
on public.noticeboard_posts for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "Authors can delete own noticeboard posts" on public.noticeboard_posts;
create policy "Authors can delete own noticeboard posts"
on public.noticeboard_posts for delete
to authenticated
using (auth.uid() = author_id);

create index if not exists noticeboard_posts_created_at_idx
on public.noticeboard_posts (created_at desc);
