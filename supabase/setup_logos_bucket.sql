-- Run this in the Supabase Dashboard → SQL Editor
-- Sets up the logos storage bucket with public read access

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logos',
    'logos',
    true,
    5242880, -- 5MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated employers to upload to their own folder
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'Employers can upload their own logos'
    ) THEN
        CREATE POLICY "Employers can upload their own logos"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = 'logos'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Allow anyone to read logos (public bucket)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'Public can read logos'
    ) THEN
        CREATE POLICY "Public can read logos"
        ON storage.objects FOR SELECT TO public
        USING (bucket_id = 'logos');
    END IF;
END $$;

-- Allow employers to update/delete their own logos
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'Employers can update own logos'
    ) THEN
        CREATE POLICY "Employers can update own logos"
        ON storage.objects FOR UPDATE TO authenticated
        USING (
            bucket_id = 'logos'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname = 'Employers can delete own logos'
    ) THEN
        CREATE POLICY "Employers can delete own logos"
        ON storage.objects FOR DELETE TO authenticated
        USING (
            bucket_id = 'logos'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;
