
-- Add 4-stage approval workflow columns to estimate_projects
ALTER TABLE public.estimate_projects
  ADD COLUMN IF NOT EXISTS built_by text DEFAULT 'Sigfried',
  ADD COLUMN IF NOT EXISTS built_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sigfried_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS leo_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS robert_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS sigfried_send_backs integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leo_send_backs integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS robert_send_backs integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_reviewer text;
