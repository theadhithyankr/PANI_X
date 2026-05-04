-- Event-Based Hiring Campaign System - Database Migration
-- Creates all campaign-related tables with proper constraints and indexes
-- Run this in the Supabase Dashboard → SQL Editor

-- ============================================================================
-- 1. hiring_campaigns table
-- ============================================================================
CREATE TABLE IF NOT EXISTS hiring_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'invite-only')),
    min_matching_score INTEGER DEFAULT 0 CHECK (min_matching_score >= 0 AND min_matching_score <= 100),
    required_skills JSONB DEFAULT '[]'::jsonb,
    min_experience INTEGER DEFAULT 0,
    max_experience INTEGER,
    education_requirements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Add comment to document the table
COMMENT ON TABLE hiring_campaigns IS 'Time-bound recruitment campaigns with multi-round pipelines';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_hiring_campaigns_employer_id ON hiring_campaigns(employer_id);
CREATE INDEX IF NOT EXISTS idx_hiring_campaigns_job_id ON hiring_campaigns(job_id);
CREATE INDEX IF NOT EXISTS idx_hiring_campaigns_status ON hiring_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_hiring_campaigns_visibility ON hiring_campaigns(visibility);
CREATE INDEX IF NOT EXISTS idx_hiring_campaigns_dates ON hiring_campaigns(start_date, end_date);

-- ============================================================================
-- 2. campaign_rounds table
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES hiring_campaigns(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('aptitude test', 'technical assessment', 'HR interview', 'technical interview', 'group discussion')),
    scheduled_date TIMESTAMPTZ NOT NULL,
    min_passing_score INTEGER DEFAULT 0 CHECK (min_passing_score >= 0 AND min_passing_score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_campaign_round_number UNIQUE (campaign_id, round_number)
);

-- Add comment to document the table
COMMENT ON TABLE campaign_rounds IS 'Sequential assessment rounds within hiring campaigns';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_campaign_rounds_campaign_id ON campaign_rounds(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_rounds_scheduled_date ON campaign_rounds(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_campaign_rounds_type ON campaign_rounds(type);

-- ============================================================================
-- 3. campaign_applications table
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES hiring_campaigns(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'rejected')),
    current_round INTEGER DEFAULT 0,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_campaign_application UNIQUE (campaign_id, candidate_id)
);

-- Add comment to document the table
COMMENT ON TABLE campaign_applications IS 'Candidate applications to hiring campaigns with progress tracking';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign_id ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_candidate_id ON campaign_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_job_id ON campaign_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON campaign_applications(status);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_current_round ON campaign_applications(current_round);

-- ============================================================================
-- 4. campaign_round_results table
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_round_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES campaign_rounds(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'pending')),
    feedback TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_application_round_result UNIQUE (application_id, round_id)
);

-- Add comment to document the table
COMMENT ON TABLE campaign_round_results IS 'Results and scores for each round of candidate applications';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_campaign_round_results_application_id ON campaign_round_results(application_id);
CREATE INDEX IF NOT EXISTS idx_campaign_round_results_round_id ON campaign_round_results(round_id);
CREATE INDEX IF NOT EXISTS idx_campaign_round_results_status ON campaign_round_results(status);

-- ============================================================================
-- 5. campaign_invitations table
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES hiring_campaigns(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT unique_campaign_invitation UNIQUE (campaign_id, candidate_id)
);

-- Add comment to document the table
COMMENT ON TABLE campaign_invitations IS 'Employer-initiated invitations to candidates for campaigns';

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_campaign_id ON campaign_invitations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_employer_id ON campaign_invitations(employer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_candidate_id ON campaign_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_status ON campaign_invitations(status);

-- ============================================================================
-- 6. Triggers for updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for hiring_campaigns
DROP TRIGGER IF EXISTS update_hiring_campaigns_updated_at ON hiring_campaigns;
CREATE TRIGGER update_hiring_campaigns_updated_at
    BEFORE UPDATE ON hiring_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for campaign_applications
DROP TRIGGER IF EXISTS update_campaign_applications_updated_at ON campaign_applications;
CREATE TRIGGER update_campaign_applications_updated_at
    BEFORE UPDATE ON campaign_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Comments on key columns
-- ============================================================================

COMMENT ON COLUMN hiring_campaigns.visibility IS 'public: visible to all eligible candidates, invite-only: visible only to invited candidates';
COMMENT ON COLUMN hiring_campaigns.min_matching_score IS 'Minimum matching score (0-100) required for candidate eligibility';
COMMENT ON COLUMN hiring_campaigns.required_skills IS 'JSON array of required skills with proficiency levels';
COMMENT ON COLUMN hiring_campaigns.education_requirements IS 'JSON array of required education levels';

COMMENT ON COLUMN campaign_rounds.round_number IS 'Sequential order of rounds (1, 2, 3, etc.)';
COMMENT ON COLUMN campaign_rounds.type IS 'Type of assessment: aptitude test, technical assessment, HR interview, technical interview, group discussion';
COMMENT ON COLUMN campaign_rounds.min_passing_score IS 'Minimum score (0-100) required to pass this round';

COMMENT ON COLUMN campaign_applications.current_round IS 'Current round number the candidate is in (0 = not started, 1+ = round number)';
COMMENT ON COLUMN campaign_applications.status IS 'Application status: pending, in-progress, completed, rejected';

COMMENT ON COLUMN campaign_round_results.status IS 'Round result: passed, failed, pending';
COMMENT ON COLUMN campaign_round_results.feedback IS 'Optional feedback from employer about candidate performance';

COMMENT ON COLUMN campaign_invitations.message IS 'Custom message from employer to candidate';
COMMENT ON COLUMN campaign_invitations.responded_at IS 'Timestamp when candidate accepted or declined the invitation';
