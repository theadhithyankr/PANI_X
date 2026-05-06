-- Admin Panel Schema Migration
-- Run this in the Supabase SQL Editor

-- 1. Add suspension flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- 2. Add moderation status to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

-- Backfill: existing active jobs are considered approved
UPDATE public.jobs SET moderation_status = 'approved' WHERE is_active = true;

-- 3. system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES public.profiles(id)
);

INSERT INTO public.system_settings (key, value, description) VALUES
  ('platform_name',        'PANI',           'Platform display name'),
  ('contact_email',        'admin@pani.com', 'Primary contact email'),
  ('region',               'Global',         'Platform region'),
  ('timezone',             'UTC',            'Default timezone'),
  ('notify_new_user',      'true',           'Alert on new user registration'),
  ('notify_new_job',       'true',           'Alert on new job posting'),
  ('notify_app_milestone', 'true',           'Alert on application milestone'),
  ('notify_system_health', 'true',           'Alert on system health events'),
  ('resume_retention_days','90',             'Days to retain inactive resumes'),
  ('log_retention_days',   '30',             'Days to retain audit logs'),
  ('job_posting_review',   'manual',         'auto-approved or manual review'),
  ('spam_detection',       'true',           'Enable spam detection'),
  ('profanity_filter',     'true',           'Enable profanity filter')
ON CONFLICT (key) DO NOTHING;

-- 4. support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority     TEXT NOT NULL DEFAULT 'normal'
                 CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to  UUID REFERENCES public.profiles(id),
  admin_reply  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_submitter ON public.support_tickets(submitter_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status    ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created   ON public.support_tickets(created_at DESC);

-- 5. admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES public.profiles(id),
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'job', 'ticket', 'setting', 'system')),
  target_id   UUID,
  details     JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin   ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target  ON public.admin_audit_logs(target_type, target_id);

-- 6. Triggers — reuse update_updated_at_column() from campaign tables
DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
