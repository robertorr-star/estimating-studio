
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drop all existing permissive anon policies and replace with authenticated-only

-- estimate_projects
DROP POLICY IF EXISTS "Anon can do everything with estimate_projects" ON public.estimate_projects;
DROP POLICY IF EXISTS "Authenticated users can do everything with estimate_projects" ON public.estimate_projects;
CREATE POLICY "Authenticated full access to estimate_projects" ON public.estimate_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- estimate_trades
DROP POLICY IF EXISTS "Anon can do everything with estimate_trades" ON public.estimate_trades;
DROP POLICY IF EXISTS "Authenticated users can do everything with estimate_trades" ON public.estimate_trades;
CREATE POLICY "Authenticated full access to estimate_trades" ON public.estimate_trades FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- estimate_line_items
DROP POLICY IF EXISTS "Anon can do everything with estimate_line_items" ON public.estimate_line_items;
DROP POLICY IF EXISTS "Authenticated users can do everything with estimate_line_items" ON public.estimate_line_items;
CREATE POLICY "Authenticated full access to estimate_line_items" ON public.estimate_line_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- estimate_schedule
DROP POLICY IF EXISTS "Anon can do everything with estimate_schedule" ON public.estimate_schedule;
DROP POLICY IF EXISTS "Authenticated users can do everything with estimate_schedule" ON public.estimate_schedule;
CREATE POLICY "Authenticated full access to estimate_schedule" ON public.estimate_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- estimate_time_sessions
DROP POLICY IF EXISTS "Anon can do everything with estimate_time_sessions" ON public.estimate_time_sessions;
DROP POLICY IF EXISTS "Authenticated users can do everything with estimate_time_sessio" ON public.estimate_time_sessions;
CREATE POLICY "Authenticated full access to estimate_time_sessions" ON public.estimate_time_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- estimate_emails
DROP POLICY IF EXISTS "Anon can do everything with estimate_emails" ON public.estimate_emails;
DROP POLICY IF EXISTS "Authenticated users can do everything with estimate_emails" ON public.estimate_emails;
CREATE POLICY "Authenticated full access to estimate_emails" ON public.estimate_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- estimate_cost_summary
DROP POLICY IF EXISTS "Anon can do everything with estimate_cost_summary" ON public.estimate_cost_summary;
DROP POLICY IF EXISTS "Authenticated users can do everything with estimate_cost_summar" ON public.estimate_cost_summary;
CREATE POLICY "Authenticated full access to estimate_cost_summary" ON public.estimate_cost_summary FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- estimator_rates
DROP POLICY IF EXISTS "Anon can do everything with estimator_rates" ON public.estimator_rates;
DROP POLICY IF EXISTS "Anyone can read estimator_rates" ON public.estimator_rates;
DROP POLICY IF EXISTS "Authenticated users can do everything with estimator_rates" ON public.estimator_rates;
CREATE POLICY "Authenticated full access to estimator_rates" ON public.estimator_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- material_library
DROP POLICY IF EXISTS "Anon can delete material_library" ON public.material_library;
DROP POLICY IF EXISTS "Anon can insert material_library" ON public.material_library;
DROP POLICY IF EXISTS "Anon can update material_library" ON public.material_library;
DROP POLICY IF EXISTS "Anyone can read material_library" ON public.material_library;
DROP POLICY IF EXISTS "Authenticated users can do everything with material_library" ON public.material_library;
CREATE POLICY "Authenticated full access to material_library" ON public.material_library FOR ALL TO authenticated USING (true) WITH CHECK (true);
