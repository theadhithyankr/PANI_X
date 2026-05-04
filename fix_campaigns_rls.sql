-- ============================================================
-- STEP 1: DIAGNOSE — run these SELECT statements first
-- ============================================================

-- Check if hiring_campaigns table exists and has data
SELECT id, employer_id, name, status, created_at
FROM hiring_campaigns
ORDER BY created_at DESC
LIMIT 20;

-- Check current RLS status on hiring_campaigns
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN (
    'hiring_campaigns', 'campaign_rounds', 'campaign_applications',
    'campaign_invitations', 'campaign_round_results'
);

-- Check existing RLS policies on hiring_campaigns
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'hiring_campaigns';

-- Check existing RLS policies on campaign_rounds
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'campaign_rounds';


-- ============================================================
-- STEP 2: FIX — run these if RLS policies are missing/wrong
-- ============================================================

-- Enable RLS on all campaign-related tables (safe to run even if already enabled)
ALTER TABLE hiring_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_invitations ENABLE ROW LEVEL SECURITY;

-- ── hiring_campaigns ──────────────────────────────────────────

-- Drop old policies first (if they exist) to avoid conflicts
DROP POLICY IF EXISTS "Employers can view their own campaigns" ON hiring_campaigns;
DROP POLICY IF EXISTS "Employers can create campaigns" ON hiring_campaigns;
DROP POLICY IF EXISTS "Employers can update their own campaigns" ON hiring_campaigns;
DROP POLICY IF EXISTS "Employers can delete their own campaigns" ON hiring_campaigns;
DROP POLICY IF EXISTS "Candidates can view public campaigns" ON hiring_campaigns;

-- Employer: full access to own campaigns
CREATE POLICY "Employers can view their own campaigns"
    ON hiring_campaigns FOR SELECT
    USING (employer_id = auth.uid());

CREATE POLICY "Employers can create campaigns"
    ON hiring_campaigns FOR INSERT
    WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can update their own campaigns"
    ON hiring_campaigns FOR UPDATE
    USING (employer_id = auth.uid())
    WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can delete their own campaigns"
    ON hiring_campaigns FOR DELETE
    USING (employer_id = auth.uid());

-- Candidates: can view public/active campaigns and campaigns they're invited to
CREATE POLICY "Candidates can view public campaigns"
    ON hiring_campaigns FOR SELECT
    USING (
        visibility = 'public'
        OR EXISTS (
            SELECT 1 FROM campaign_invitations ci
            WHERE ci.campaign_id = hiring_campaigns.id
              AND ci.candidate_id = auth.uid()
        )
    );

-- ── campaign_rounds ───────────────────────────────────────────

DROP POLICY IF EXISTS "Employers can manage rounds for their campaigns" ON campaign_rounds;
DROP POLICY IF EXISTS "Anyone can view rounds for accessible campaigns" ON campaign_rounds;

CREATE POLICY "Employers can manage rounds for their campaigns"
    ON campaign_rounds FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM hiring_campaigns hc
            WHERE hc.id = campaign_rounds.campaign_id
              AND hc.employer_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM hiring_campaigns hc
            WHERE hc.id = campaign_rounds.campaign_id
              AND hc.employer_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view rounds for accessible campaigns"
    ON campaign_rounds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM hiring_campaigns hc
            WHERE hc.id = campaign_rounds.campaign_id
              AND (
                  hc.employer_id = auth.uid()
                  OR hc.visibility = 'public'
                  OR EXISTS (
                      SELECT 1 FROM campaign_invitations ci
                      WHERE ci.campaign_id = hc.id
                        AND ci.candidate_id = auth.uid()
                  )
              )
        )
    );

-- ── campaign_applications ─────────────────────────────────────

DROP POLICY IF EXISTS "Candidates can manage their own applications" ON campaign_applications;
DROP POLICY IF EXISTS "Employers can view applications for their campaigns" ON campaign_applications;

CREATE POLICY "Candidates can manage their own applications"
    ON campaign_applications FOR ALL
    USING (candidate_id = auth.uid())
    WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Employers can view applications for their campaigns"
    ON campaign_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM hiring_campaigns hc
            WHERE hc.id = campaign_applications.campaign_id
              AND hc.employer_id = auth.uid()
        )
    );

CREATE POLICY "Employers can update applications for their campaigns"
    ON campaign_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM hiring_campaigns hc
            WHERE hc.id = campaign_applications.campaign_id
              AND hc.employer_id = auth.uid()
        )
    );

-- ── campaign_round_results ────────────────────────────────────

DROP POLICY IF EXISTS "Employers can manage round results for their campaigns" ON campaign_round_results;
DROP POLICY IF EXISTS "Candidates can view their own round results" ON campaign_round_results;

CREATE POLICY "Employers can manage round results for their campaigns"
    ON campaign_round_results FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campaign_applications ca
            JOIN hiring_campaigns hc ON hc.id = ca.campaign_id
            WHERE ca.id = campaign_round_results.application_id
              AND hc.employer_id = auth.uid()
        )
    );

CREATE POLICY "Candidates can view their own round results"
    ON campaign_round_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaign_applications ca
            WHERE ca.id = campaign_round_results.application_id
              AND ca.candidate_id = auth.uid()
        )
    );

-- ── campaign_invitations ──────────────────────────────────────

DROP POLICY IF EXISTS "Employers can manage invitations for their campaigns" ON campaign_invitations;
DROP POLICY IF EXISTS "Candidates can view and respond to their invitations" ON campaign_invitations;

CREATE POLICY "Employers can manage invitations for their campaigns"
    ON campaign_invitations FOR ALL
    USING (employer_id = auth.uid())
    WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Candidates can view and respond to their invitations"
    ON campaign_invitations FOR ALL
    USING (candidate_id = auth.uid())
    WITH CHECK (candidate_id = auth.uid());


-- ============================================================
-- STEP 3: VERIFY — run after applying fixes
-- ============================================================

-- Should now return your campaigns
SELECT id, name, status, visibility, employer_id, created_at
FROM hiring_campaigns
ORDER BY created_at DESC;

-- Should return the rounds you saved
SELECT cr.id, cr.name, cr.type, cr.scheduled_date, hc.name AS campaign_name
FROM campaign_rounds cr
JOIN hiring_campaigns hc ON hc.id = cr.campaign_id
ORDER BY hc.created_at DESC, cr.round_number;
