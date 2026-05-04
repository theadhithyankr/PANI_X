-- Allow candidates to mark their own received messages as read/unread
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'Receivers can update is_read on own messages'
  ) THEN
    CREATE POLICY "Receivers can update is_read on own messages"
      ON public.messages FOR UPDATE TO authenticated
      USING (receiver_id = auth.uid())
      WITH CHECK (receiver_id = auth.uid());
  END IF;
END $$;

-- Allow candidates to mark their own application updates as viewed/unviewed
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applications' AND policyname = 'Candidates can update is_viewed on own applications'
  ) THEN
    CREATE POLICY "Candidates can update is_viewed on own applications"
      ON public.applications FOR UPDATE TO authenticated
      USING (candidate_id = auth.uid())
      WITH CHECK (candidate_id = auth.uid());
  END IF;
END $$;
