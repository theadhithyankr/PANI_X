-- Fix storage bucket RLS policies for logos, avatars, and covers
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to re-run: drops old policies first, then recreates them cleanly

-- ── Ensure buckets exist (idempotent) ────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('covers', 'covers', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- ── Drop ALL old storage policies (clear any stale state) ─────
DROP POLICY IF EXISTS "Employers can upload their own logos"  ON storage.objects;
DROP POLICY IF EXISTS "Employers can update own logos"        ON storage.objects;
DROP POLICY IF EXISTS "Employers can delete own logos"        ON storage.objects;
DROP POLICY IF EXISTS "Public can read logos"                 ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar"           ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar"           ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar"           ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars"               ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own cover"            ON storage.objects;
DROP POLICY IF EXISTS "Users can update own cover"            ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own cover"            ON storage.objects;
DROP POLICY IF EXISTS "Public can read covers"                ON storage.objects;

-- ── logos bucket ──────────────────────────────────────────────
CREATE POLICY "Employers can upload their own logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Employers can update own logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Employers can delete own logos"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'logos');

-- ── avatars bucket ────────────────────────────────────────────
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- ── covers bucket ─────────────────────────────────────────────
CREATE POLICY "Users can upload own cover"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own cover"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own cover"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can read covers"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'covers');
