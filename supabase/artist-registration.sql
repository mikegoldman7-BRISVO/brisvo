-- Apply this in the Supabase SQL editor before relying on client-side
-- artist profile bootstrap and dashboard editing.
--
-- If duplicate artists.owner_id rows already exist, resolve them first so
-- the unique index can be created cleanly.
--
-- If your storage bucket names differ from "artist-images" and "artist-demos",
-- update the bucket_id literals below before running this script.

begin;

create unique index if not exists artists_owner_id_unique_idx
  on public.artists (owner_id);

alter table public.artists enable row level security;
alter table public.demos enable row level security;

drop policy if exists "artists_read_published_profiles" on public.artists;
create policy "artists_read_published_profiles"
  on public.artists
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "artists_select_own_profile" on public.artists;
create policy "artists_select_own_profile"
  on public.artists
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "artists_insert_own_profile" on public.artists;
create policy "artists_insert_own_profile"
  on public.artists
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "artists_update_own_profile" on public.artists;
create policy "artists_update_own_profile"
  on public.artists
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "demos_read_published_artists" on public.demos;
create policy "demos_read_published_artists"
  on public.demos
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.artists
      where artists.id = demos.artist_id
        and artists.is_published = true
    )
  );

drop policy if exists "demos_manage_own_artist" on public.demos;
create policy "demos_manage_own_artist"
  on public.demos
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.artists
      where artists.id = demos.artist_id
        and artists.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.artists
      where artists.id = demos.artist_id
        and artists.owner_id = auth.uid()
    )
  );

drop policy if exists "storage_list_own_profile_images" on storage.objects;
create policy "storage_list_own_profile_images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'artist-images'
    and exists (
      select 1
      from public.artists
      where artists.owner_id = auth.uid()
        and artists.id::text = split_part(name, '/', 1)
    )
  );

drop policy if exists "storage_insert_own_profile_images" on storage.objects;
create policy "storage_insert_own_profile_images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'artist-images'
    and exists (
      select 1
      from public.artists
      where artists.owner_id = auth.uid()
        and artists.id::text = split_part(name, '/', 1)
    )
  );

drop policy if exists "storage_delete_own_profile_images" on storage.objects;
create policy "storage_delete_own_profile_images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'artist-images'
    and exists (
      select 1
      from public.artists
      where artists.owner_id = auth.uid()
        and artists.id::text = split_part(name, '/', 1)
    )
  );

drop policy if exists "storage_list_own_demo_audio" on storage.objects;
create policy "storage_list_own_demo_audio"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'artist-demos'
    and exists (
      select 1
      from public.artists
      where artists.owner_id = auth.uid()
        and artists.id::text = split_part(name, '/', 1)
    )
  );

drop policy if exists "storage_insert_own_demo_audio" on storage.objects;
create policy "storage_insert_own_demo_audio"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'artist-demos'
    and exists (
      select 1
      from public.artists
      where artists.owner_id = auth.uid()
        and artists.id::text = split_part(name, '/', 1)
    )
  );

drop policy if exists "storage_delete_own_demo_audio" on storage.objects;
create policy "storage_delete_own_demo_audio"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'artist-demos'
    and exists (
      select 1
      from public.artists
      where artists.owner_id = auth.uid()
        and artists.id::text = split_part(name, '/', 1)
    )
  );

commit;
