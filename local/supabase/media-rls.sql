-- BrisVO media RLS setup
-- Project ref inferred from .env: xpbiewlnmcsutmgyyqdg
--
-- Run this in the Supabase SQL editor for the production project.
-- It is safe to re-run because each policy is dropped before recreation.
-- This script resets the relevant policies to a minimal known-good set.

-- 1) Verify the currently signed-in artist is linked correctly.
select id, owner_id, name
from public.artists
where owner_id = auth.uid();

-- 2) Enable RLS on tables touched by the dashboard.
alter table public.artists enable row level security;
alter table public.demos enable row level security;

-- 3) Reset artist table policies.
drop policy if exists "Artists can update own profile" on public.artists;
drop policy if exists "Artists can view own profile" on public.artists;
drop policy if exists "Public can view published artists" on public.artists;
drop policy if exists "artists_select_own" on public.artists;
drop policy if exists "artists_update_own" on public.artists;
drop policy if exists "owner_read_own_artist" on public.artists;
drop policy if exists "owner_update_own_artist" on public.artists;
drop policy if exists "owners can update own artist profile" on public.artists;
drop policy if exists "public can read published artists" on public.artists;
drop policy if exists "public_read_published_artists" on public.artists;

create policy "public_read_published_artists"
on public.artists
for select
to public
using (coalesce(is_published, false) = true);

create policy "artists_select_own"
on public.artists
for select
to authenticated
using (owner_id = auth.uid());

create policy "artists_update_own"
on public.artists
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- 4) Reset demos table policies.
drop policy if exists "Artists can manage own demos" on public.demos;
drop policy if exists "Public can view demos of published artists" on public.demos;
drop policy if exists "demos_select_own" on public.demos;
drop policy if exists "demos_insert_own" on public.demos;
drop policy if exists "demos_update_own" on public.demos;
drop policy if exists "demos_delete_own" on public.demos;
drop policy if exists "owner_read_own_demos" on public.demos;
drop policy if exists "public_read_published_demos" on public.demos;

create policy "public_read_published_demos"
on public.demos
for select
to public
using (
  exists (
    select 1
    from public.artists a
    where a.id = demos.artist_id
      and coalesce(a.is_published, false) = true
  )
);

create policy "demos_select_own"
on public.demos
for select
to authenticated
using (
  exists (
    select 1
    from public.artists a
    where a.id = demos.artist_id
      and a.owner_id = auth.uid()
  )
);

create policy "demos_insert_own"
on public.demos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.artists a
    where a.id = demos.artist_id
      and a.owner_id = auth.uid()
  )
);

create policy "demos_update_own"
on public.demos
for update
to authenticated
using (
  exists (
    select 1
    from public.artists a
    where a.id = demos.artist_id
      and a.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists a
    where a.id = demos.artist_id
      and a.owner_id = auth.uid()
  )
);

create policy "demos_delete_own"
on public.demos
for delete
to authenticated
using (
  exists (
    select 1
    from public.artists a
    where a.id = demos.artist_id
      and a.owner_id = auth.uid()
  )
);

-- 5) Reset storage policies for artist-owned media only.
drop policy if exists "artist_media_select_own" on storage.objects;
drop policy if exists "artist_media_insert_own" on storage.objects;
drop policy if exists "artist_media_delete_own" on storage.objects;

create policy "artist_media_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('artist-images', 'artist-demos')
  and exists (
    select 1
    from public.artists a
    where a.owner_id = auth.uid()
      and a.id::text = split_part(name, '/', 1)
  )
);

create policy "artist_media_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('artist-images', 'artist-demos')
  and exists (
    select 1
    from public.artists a
    where a.owner_id = auth.uid()
      and a.id::text = split_part(name, '/', 1)
  )
);

create policy "artist_media_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('artist-images', 'artist-demos')
  and exists (
    select 1
    from public.artists a
    where a.owner_id = auth.uid()
      and a.id::text = split_part(name, '/', 1)
  )
);

-- 6) Inspect the resulting policies.
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where
  (schemaname = 'public' and tablename in ('artists', 'demos'))
  or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- 7) Inspect bucket config if uploads still fail.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('artist-images', 'artist-demos');

-- 8) Temporary audio upload diagnostics.
-- If MP3 upload still fails with RLS, test storage insert in isolation:
--
-- drop policy if exists "artist_media_insert_own" on storage.objects;
-- create policy "artist_media_insert_authenticated_test"
-- on storage.objects
-- for insert
-- to authenticated
-- with check (
--   bucket_id in ('artist-demos')
-- );
--
-- If the file upload starts working after that, the blocker is the
-- storage.objects insert predicate for artist-demos.
--
-- If the file uploads but the dashboard then says the demo row insert is
-- blocked by RLS, test public.demos insert in isolation:
--
-- drop policy if exists "demos_insert_own" on public.demos;
-- create policy "demos_insert_authenticated_test"
-- on public.demos
-- for insert
-- to authenticated
-- with check (true);
--
-- If that makes demo creation work, the blocker is the public.demos insert
-- predicate rather than the storage bucket.
