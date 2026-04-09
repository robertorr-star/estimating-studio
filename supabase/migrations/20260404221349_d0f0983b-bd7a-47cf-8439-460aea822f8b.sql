
-- Table: estimate_time_sessions
CREATE TABLE public.estimate_time_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT 'Sigfried',
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  duration_minutes numeric DEFAULT 0,
  activity_type text NOT NULL DEFAULT 'review',
  keystrokes_detected boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_time_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything with estimate_time_sessions"
  ON public.estimate_time_sessions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_time_sessions_estimate ON public.estimate_time_sessions(estimate_id);
CREATE INDEX idx_time_sessions_user ON public.estimate_time_sessions(user_name);

-- Table: estimate_cost_summary
CREATE TABLE public.estimate_cost_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL UNIQUE,
  estimate_number text NOT NULL DEFAULT '',
  project_name text NOT NULL DEFAULT '',
  estimator_primary text DEFAULT 'Sigfried',
  estimator_secondary text,
  total_hours_sigfried numeric DEFAULT 0,
  total_hours_joseph numeric DEFAULT 0,
  total_hours_robert numeric DEFAULT 0,
  total_hours_all numeric DEFAULT 0,
  cost_sigfried numeric DEFAULT 0,
  cost_joseph numeric DEFAULT 0,
  cost_robert numeric DEFAULT 0,
  total_estimate_cost numeric DEFAULT 0,
  estimate_status text DEFAULT 'draft',
  contract_value numeric DEFAULT 0,
  return_on_estimate numeric,
  won boolean,
  loss_reason text,
  avg_hours_per_trade numeric DEFAULT 0,
  cost_per_sqft_of_estimate numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_cost_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything with estimate_cost_summary"
  ON public.estimate_cost_summary FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_cost_summary_estimate ON public.estimate_cost_summary(estimate_id);

-- Table: estimator_rates
CREATE TABLE public.estimator_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimator_name text NOT NULL,
  hourly_rate numeric NOT NULL DEFAULT 0,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimator_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything with estimator_rates"
  ON public.estimator_rates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read estimator_rates"
  ON public.estimator_rates FOR SELECT TO anon
  USING (true);
