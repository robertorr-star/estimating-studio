-- Allow anon to INSERT/UPDATE/DELETE on all tables (no auth yet)

CREATE POLICY "Anon can insert material_library"
ON public.material_library FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update material_library"
ON public.material_library FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete material_library"
ON public.material_library FOR DELETE TO anon USING (true);

CREATE POLICY "Anon can do everything with estimate_projects"
ON public.estimate_projects FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can do everything with estimate_trades"
ON public.estimate_trades FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can do everything with estimate_line_items"
ON public.estimate_line_items FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can do everything with estimate_schedule"
ON public.estimate_schedule FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can do everything with estimate_emails"
ON public.estimate_emails FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can do everything with estimate_time_sessions"
ON public.estimate_time_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can do everything with estimate_cost_summary"
ON public.estimate_cost_summary FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can do everything with estimator_rates"
ON public.estimator_rates FOR ALL TO anon USING (true) WITH CHECK (true);