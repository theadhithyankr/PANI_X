-- Enable Supabase Realtime for key tables
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- Add tables to the realtime publication (skip if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE applications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE interviews;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Also apply the missing delete policy for jobs (so employers can delete their own jobs)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'jobs' AND policyname = 'Employers can delete own jobs'
  ) THEN
    CREATE POLICY "Employers can delete own jobs"
      ON public.jobs FOR DELETE TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;

-- CRITICAL: Allow employers to UPDATE applications for their own jobs
-- Without this, status changes (pending -> interview -> offer etc.) silently fail
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applications' AND policyname = 'Employers can update applications for own jobs'
  ) THEN
    CREATE POLICY "Employers can update applications for own jobs"
      ON public.applications FOR UPDATE TO authenticated
      USING (
        job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
      );
  END IF;
END $$;

-- Allow employers to read applications for their own jobs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applications' AND policyname = 'Employers can read applications for own jobs'
  ) THEN
    CREATE POLICY "Employers can read applications for own jobs"
      ON public.applications FOR SELECT TO authenticated
      USING (
        candidate_id = auth.uid() OR
        job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
      );
  END IF;
END $$;

-- Allow employers to update their own jobs (for toggling is_active, editing, etc.)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'jobs' AND policyname = 'Employers can update own jobs'
  ) THEN
    CREATE POLICY "Employers can update own jobs"
      ON public.jobs FOR UPDATE TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;

-- Allow employers to update their own interviews
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'interviews' AND policyname = 'Employers can update own interviews'
  ) THEN
    CREATE POLICY "Employers can update own interviews"
      ON public.interviews FOR UPDATE TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;

-- Allow employers to delete their own interviews
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'interviews' AND policyname = 'Employers can delete own interviews'
  ) THEN
    CREATE POLICY "Employers can delete own interviews"
      ON public.interviews FOR DELETE TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;
