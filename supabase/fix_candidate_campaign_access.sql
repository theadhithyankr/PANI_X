-- Fix candidate access to hiring campaigns
-- Run this in Supabase Dashboard → SQL Editor

-- Drop old candidate-read policies (all known variants)
DROP POLICY IF EXISTS "Candidates can read active public campaigns" ON hiring_campaigns;
DROP POLICY IF EXISTS "Candidates can read invited campaigns" ON hiring_campaigns;
DROP POLICY IF EXISTS "Candidates can view public campaigns" ON hiring_campaigns;
DROP POLICY IF EXISTS "Candidates can view accessible campaigns" ON hiring_campaigns;

-- Drop old campaign_rounds candidate policies
DROP POLICY IF EXISTS "Candidates can read rounds for applied campaigns" ON campaign_rounds;
DROP POLICY IF EXISTS "Candidates can read rounds for public campaigns" ON campaign_rounds;
DROP POLICY IF EXISTS "Anyone can view rounds for accessible campaigns" ON campaign_rounds;

-- ── hiring_campaigns: candidate read ──────────────────────────
-- Candidates (and any authenticated user) can see:
--   1. Active public campaigns
--   2. Any campaign they have been invited to
CREATE POLICY "Candidates can view accessible campaigns"
    ON hiring_campaigns FOR SELECT
    USING (
        (status = 'active' AND visibility = 'public')
        OR EXISTS (
            SELECT 1 FROM campaign_invitations ci
            WHERE ci.campaign_id = hiring_campaigns.id
              AND ci.candidate_id = auth.uid()
        )
    );

-- ── campaign_rounds: candidate read ───────────────────────────
-- Candidates can see rounds for campaigns they can access
CREATE POLICY "Candidates can view rounds for accessible campaigns"
    ON campaign_rounds FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM hiring_campaigns
            WHERE (status = 'active' AND visibility = 'public')
               OR EXISTS (
                   SELECT 1 FROM campaign_invitations ci
                   WHERE ci.campaign_id = hiring_campaigns.id
                     AND ci.candidate_id = auth.uid()
               )
        )
        OR campaign_id IN (
            SELECT campaign_id FROM campaign_applications
            WHERE candidate_id = auth.uid()
        )
    );
