-- Row Level Security (RLS) Policies for Event-Based Hiring Campaign System
-- Run this in the Supabase Dashboard → SQL Editor after running create_campaign_tables.sql

-- ============================================================================
-- 1. Enable RLS on all campaign tables
-- ============================================================================

ALTER TABLE hiring_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. hiring_campaigns policies
-- ============================================================================

-- Employers can create campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hiring_campaigns' AND policyname = 'Employers can create own campaigns'
  ) THEN
    CREATE POLICY "Employers can create own campaigns"
      ON public.hiring_campaigns FOR INSERT TO authenticated
      WITH CHECK (
        employer_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'employer')
      );
  END IF;
END $$;

-- Employers can read their own campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hiring_campaigns' AND policyname = 'Employers can read own campaigns'
  ) THEN
    CREATE POLICY "Employers can read own campaigns"
      ON public.hiring_campaigns FOR SELECT TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;

-- Employers can update their own campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hiring_campaigns' AND policyname = 'Employers can update own campaigns'
  ) THEN
    CREATE POLICY "Employers can update own campaigns"
      ON public.hiring_campaigns FOR UPDATE TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;

-- Employers can delete their own campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hiring_campaigns' AND policyname = 'Employers can delete own campaigns'
  ) THEN
    CREATE POLICY "Employers can delete own campaigns"
      ON public.hiring_campaigns FOR DELETE TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;

-- Candidates can read active public campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hiring_campaigns' AND policyname = 'Candidates can read active public campaigns'
  ) THEN
    CREATE POLICY "Candidates can read active public campaigns"
      ON public.hiring_campaigns FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'candidate') AND
        status = 'active' AND
        visibility = 'public'
      );
  END IF;
END $$;

-- Candidates can read campaigns they are invited to
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hiring_campaigns' AND policyname = 'Candidates can read invited campaigns'
  ) THEN
    CREATE POLICY "Candidates can read invited campaigns"
      ON public.hiring_campaigns FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'candidate') AND
        id IN (
          SELECT campaign_id FROM public.campaign_invitations
          WHERE candidate_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 3. campaign_rounds policies
-- ============================================================================

-- Employers can create rounds for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_rounds' AND policyname = 'Employers can create rounds for own campaigns'
  ) THEN
    CREATE POLICY "Employers can create rounds for own campaigns"
      ON public.campaign_rounds FOR INSERT TO authenticated
      WITH CHECK (
        campaign_id IN (
          SELECT id FROM public.hiring_campaigns WHERE employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employers can read rounds for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_rounds' AND policyname = 'Employers can read rounds for own campaigns'
  ) THEN
    CREATE POLICY "Employers can read rounds for own campaigns"
      ON public.campaign_rounds FOR SELECT TO authenticated
      USING (
        campaign_id IN (
          SELECT id FROM public.hiring_campaigns WHERE employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employers can update rounds for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_rounds' AND policyname = 'Employers can update rounds for own campaigns'
  ) THEN
    CREATE POLICY "Employers can update rounds for own campaigns"
      ON public.campaign_rounds FOR UPDATE TO authenticated
      USING (
        campaign_id IN (
          SELECT id FROM public.hiring_campaigns WHERE employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employers can delete rounds for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_rounds' AND policyname = 'Employers can delete rounds for own campaigns'
  ) THEN
    CREATE POLICY "Employers can delete rounds for own campaigns"
      ON public.campaign_rounds FOR DELETE TO authenticated
      USING (
        campaign_id IN (
          SELECT id FROM public.hiring_campaigns WHERE employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Candidates can read rounds for campaigns they've applied to
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_rounds' AND policyname = 'Candidates can read rounds for applied campaigns'
  ) THEN
    CREATE POLICY "Candidates can read rounds for applied campaigns"
      ON public.campaign_rounds FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'candidate') AND
        campaign_id IN (
          SELECT campaign_id FROM public.campaign_applications
          WHERE candidate_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Candidates can read rounds for public active campaigns (for browsing before applying)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_rounds' AND policyname = 'Candidates can read rounds for public campaigns'
  ) THEN
    CREATE POLICY "Candidates can read rounds for public campaigns"
      ON public.campaign_rounds FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'candidate') AND
        campaign_id IN (
          SELECT id FROM public.hiring_campaigns
          WHERE status = 'active' AND visibility = 'public'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. campaign_applications policies
-- ============================================================================

-- Candidates can create their own applications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_applications' AND policyname = 'Candidates can create own applications'
  ) THEN
    CREATE POLICY "Candidates can create own applications"
      ON public.campaign_applications FOR INSERT TO authenticated
      WITH CHECK (
        candidate_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'candidate')
      );
  END IF;
END $$;

-- Candidates can read their own applications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_applications' AND policyname = 'Candidates can read own applications'
  ) THEN
    CREATE POLICY "Candidates can read own applications"
      ON public.campaign_applications FOR SELECT TO authenticated
      USING (candidate_id = auth.uid());
  END IF;
END $$;

-- Employers can read applications for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_applications' AND policyname = 'Employers can read applications for own campaigns'
  ) THEN
    CREATE POLICY "Employers can read applications for own campaigns"
      ON public.campaign_applications FOR SELECT TO authenticated
      USING (
        campaign_id IN (
          SELECT id FROM public.hiring_campaigns WHERE employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employers can update applications for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_applications' AND policyname = 'Employers can update applications for own campaigns'
  ) THEN
    CREATE POLICY "Employers can update applications for own campaigns"
      ON public.campaign_applications FOR UPDATE TO authenticated
      USING (
        campaign_id IN (
          SELECT id FROM public.hiring_campaigns WHERE employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 5. campaign_round_results policies
-- ============================================================================

-- Employers can create results for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_round_results' AND policyname = 'Employers can create results for own campaigns'
  ) THEN
    CREATE POLICY "Employers can create results for own campaigns"
      ON public.campaign_round_results FOR INSERT TO authenticated
      WITH CHECK (
        application_id IN (
          SELECT ca.id FROM public.campaign_applications ca
          JOIN public.hiring_campaigns hc ON ca.campaign_id = hc.id
          WHERE hc.employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employers can read results for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_round_results' AND policyname = 'Employers can read results for own campaigns'
  ) THEN
    CREATE POLICY "Employers can read results for own campaigns"
      ON public.campaign_round_results FOR SELECT TO authenticated
      USING (
        application_id IN (
          SELECT ca.id FROM public.campaign_applications ca
          JOIN public.hiring_campaigns hc ON ca.campaign_id = hc.id
          WHERE hc.employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employers can update results for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_round_results' AND policyname = 'Employers can update results for own campaigns'
  ) THEN
    CREATE POLICY "Employers can update results for own campaigns"
      ON public.campaign_round_results FOR UPDATE TO authenticated
      USING (
        application_id IN (
          SELECT ca.id FROM public.campaign_applications ca
          JOIN public.hiring_campaigns hc ON ca.campaign_id = hc.id
          WHERE hc.employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employers can delete results for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_round_results' AND policyname = 'Employers can delete results for own campaigns'
  ) THEN
    CREATE POLICY "Employers can delete results for own campaigns"
      ON public.campaign_round_results FOR DELETE TO authenticated
      USING (
        application_id IN (
          SELECT ca.id FROM public.campaign_applications ca
          JOIN public.hiring_campaigns hc ON ca.campaign_id = hc.id
          WHERE hc.employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Candidates can read their own results
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_round_results' AND policyname = 'Candidates can read own results'
  ) THEN
    CREATE POLICY "Candidates can read own results"
      ON public.campaign_round_results FOR SELECT TO authenticated
      USING (
        application_id IN (
          SELECT id FROM public.campaign_applications
          WHERE candidate_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 6. campaign_invitations policies
-- ============================================================================

-- Employers can create invitations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_invitations' AND policyname = 'Employers can create invitations'
  ) THEN
    CREATE POLICY "Employers can create invitations"
      ON public.campaign_invitations FOR INSERT TO authenticated
      WITH CHECK (
        employer_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'employer') AND
        campaign_id IN (
          SELECT id FROM public.hiring_campaigns WHERE employer_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employers can read invitations for their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_invitations' AND policyname = 'Employers can read own invitations'
  ) THEN
    CREATE POLICY "Employers can read own invitations"
      ON public.campaign_invitations FOR SELECT TO authenticated
      USING (employer_id = auth.uid());
  END IF;
END $$;

-- Candidates can read invitations sent to them
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_invitations' AND policyname = 'Candidates can read own invitations'
  ) THEN
    CREATE POLICY "Candidates can read own invitations"
      ON public.campaign_invitations FOR SELECT TO authenticated
      USING (candidate_id = auth.uid());
  END IF;
END $$;

-- Candidates can update invitations sent to them (accept/decline)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_invitations' AND policyname = 'Candidates can update own invitations'
  ) THEN
    CREATE POLICY "Candidates can update own invitations"
      ON public.campaign_invitations FOR UPDATE TO authenticated
      USING (candidate_id = auth.uid())
      WITH CHECK (candidate_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 7. Comments documenting the security model
-- ============================================================================

COMMENT ON TABLE hiring_campaigns IS 'RLS: Employers CRUD own campaigns; Candidates read active/public or invited campaigns';
COMMENT ON TABLE campaign_rounds IS 'RLS: Employers CRUD rounds for own campaigns; Candidates read rounds for applied/public campaigns';
COMMENT ON TABLE campaign_applications IS 'RLS: Candidates create/read own applications; Employers read/update applications for own campaigns';
COMMENT ON TABLE campaign_round_results IS 'RLS: Employers CRUD results for own campaigns; Candidates read own results';
COMMENT ON TABLE campaign_invitations IS 'RLS: Employers create invitations; Candidates read/update invitations sent to them';
