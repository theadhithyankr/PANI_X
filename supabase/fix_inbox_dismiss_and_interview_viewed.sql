-- Track whether candidates have viewed their interview notifications
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_dismissed BOOLEAN DEFAULT FALSE;

-- Track dismissed state for messages and applications
ALTER TABLE messages ADD COLUMN IF NOT EXISTS candidate_dismissed BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_dismissed BOOLEAN DEFAULT FALSE;

-- Allow candidates to update is_viewed and candidate_dismissed on their own interviews
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'interviews' AND policyname = 'Candidates can update own interview flags'
  ) THEN
    CREATE POLICY "Candidates can update own interview flags"
      ON public.interviews FOR UPDATE TO authenticated
      USING (candidate_id = auth.uid())
      WITH CHECK (candidate_id = auth.uid());
  END IF;
END $$;

-- Allow candidates to update candidate_dismissed on their own messages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'Receivers can dismiss own messages'
  ) THEN
    CREATE POLICY "Receivers can dismiss own messages"
      ON public.messages FOR UPDATE TO authenticated
      USING (receiver_id = auth.uid())
      WITH CHECK (receiver_id = auth.uid());
  END IF;
END $$;

-- Allow candidates to update candidate_dismissed on their own applications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applications' AND policyname = 'Candidates can dismiss own applications'
  ) THEN
    CREATE POLICY "Candidates can dismiss own applications"
      ON public.applications FOR UPDATE TO authenticated
      USING (candidate_id = auth.uid())
      WITH CHECK (candidate_id = auth.uid());
  END IF;
END $$;
