-- Admin Panel RLS Policies
-- Run this after admin_panel_schema.sql

-- ============================================================
-- profiles: admins can update any profile (suspend / role change)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update any profile'
  ) THEN
    CREATE POLICY "Admins can update any profile"
      ON public.profiles FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      ));
  END IF;
END $$;

-- ============================================================
-- jobs: admins can update any job (moderation_status, is_active)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Admins can update any job'
  ) THEN
    CREATE POLICY "Admins can update any job"
      ON public.jobs FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

-- ============================================================
-- system_settings: admin-only read + write
-- ============================================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Admins can read settings'
  ) THEN
    CREATE POLICY "Admins can read settings"
      ON public.system_settings FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Admins can update settings'
  ) THEN
    CREATE POLICY "Admins can update settings"
      ON public.system_settings FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

-- ============================================================
-- support_tickets: users insert/read own; admins see + update all
-- ============================================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Users can create support tickets'
  ) THEN
    CREATE POLICY "Users can create support tickets"
      ON public.support_tickets FOR INSERT TO authenticated
      WITH CHECK (submitter_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Users can read own tickets'
  ) THEN
    CREATE POLICY "Users can read own tickets"
      ON public.support_tickets FOR SELECT TO authenticated
      USING (
        submitter_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Admins can update any ticket'
  ) THEN
    CREATE POLICY "Admins can update any ticket"
      ON public.support_tickets FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

-- ============================================================
-- admin_audit_logs: admins insert + read; no one else
-- ============================================================
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_logs' AND policyname = 'Admins can insert audit logs'
  ) THEN
    CREATE POLICY "Admins can insert audit logs"
      ON public.admin_audit_logs FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_logs' AND policyname = 'Admins can read audit logs'
  ) THEN
    CREATE POLICY "Admins can read audit logs"
      ON public.admin_audit_logs FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;
