## Supabase RLS fix

If dashboard uploads fail with `new row violates row-level security policy`, the frontend is working but the hosted Supabase project is missing the required owner-scoped policies.

Run the SQL in [local/supabase/media-rls.sql](/home/mladenka/Desktop/upw/brisvo/local/supabase/media-rls.sql) in the Supabase SQL editor for project `xpbiewlnmcsutmgyyqdg`.

The script:

- verifies `public.artists.owner_id = auth.uid()` for the signed-in artist
- enables RLS on `public.artists` and `public.demos`
- recreates owner-scoped policies for artist profile updates and demo CRUD
- recreates storage policies for `artist-images` and `artist-demos`
- prints bucket settings so bucket names and limits can be verified

Expected buckets:

- `artist-images`: public, 8 MB max, `image/jpeg,image/png,image/webp`
- `artist-demos`: public, 25 MB max, `audio/mpeg`
