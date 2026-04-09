
-- Create estimate_projects table
CREATE TABLE public.estimate_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','signed','converted_to_project')),
  project_name TEXT NOT NULL DEFAULT '',
  project_address TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  project_type TEXT DEFAULT 'Remodel' CHECK (project_type IN ('Addition','ADU','Remodel','New Construction','Commercial','Other')),
  total_sq_ft DECIMAL DEFAULT 0,
  project_start_date DATE,
  estimated_duration_days INTEGER DEFAULT 0,
  estimated_end_date DATE,
  total_build_cost DECIMAL DEFAULT 0,
  total_profit DECIMAL DEFAULT 0,
  gross_margin_pct DECIMAL DEFAULT 0,
  total_contract_price DECIMAL DEFAULT 0,
  cost_per_sqft DECIMAL DEFAULT 0,
  material_tax_rate DECIMAL DEFAULT 0.1025,
  created_by TEXT DEFAULT 'Sigfried',
  reviewed_by TEXT,
  approved_by TEXT,
  submitted_date DATE,
  approved_date DATE,
  client_signed_date DATE,
  converted_date DATE,
  notes TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create estimate_trades table
CREATE TABLE public.estimate_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimate_projects(id) ON DELETE CASCADE,
  trade_group TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  total_labor_hours DECIMAL DEFAULT 0,
  total_labor_cost DECIMAL DEFAULT 0,
  total_materials_cost DECIMAL DEFAULT 0,
  total_subcontract_cost DECIMAL DEFAULT 0,
  total_equipment_cost DECIMAL DEFAULT 0,
  total_other_cost DECIMAL DEFAULT 0,
  total_ext_cost DECIMAL DEFAULT 0,
  total_profit DECIMAL DEFAULT 0,
  total_price DECIMAL DEFAULT 0,
  schedule_duration_days INTEGER DEFAULT 0,
  team_size INTEGER DEFAULT 1,
  predecessor_trade_id UUID REFERENCES public.estimate_trades(id),
  schedule_start_date DATE,
  schedule_end_date DATE,
  inspection_required BOOLEAN DEFAULT false,
  inspection_type TEXT DEFAULT '',
  inspection_notes TEXT DEFAULT '',
  relationship_type TEXT DEFAULT 'FS' CHECK (relationship_type IN ('FS','SS','SS+LAG','FS+LAG')),
  lag_days INTEGER DEFAULT 0,
  subcontractor_name TEXT DEFAULT '',
  sub_duration_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create estimate_line_items table
CREATE TABLE public.estimate_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimate_projects(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.estimate_trades(id) ON DELETE CASCADE,
  item_number INTEGER DEFAULT 1,
  account_code TEXT DEFAULT '',
  description TEXT DEFAULT '',
  quantity DECIMAL DEFAULT 0,
  unit TEXT DEFAULT 'each',
  unit_cost DECIMAL DEFAULT 0,
  ext_cost DECIMAL DEFAULT 0,
  cost_type TEXT DEFAULT 'Materials' CHECK (cost_type IN ('Labor','Materials','Subcontract','Equipment','Other','Design/Permit','--')),
  profit_pct DECIMAL DEFAULT 0,
  profit_amount DECIMAL DEFAULT 0,
  line_total DECIMAL DEFAULT 0,
  material_tax_applied BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  subcontractor_name TEXT DEFAULT '',
  sub_duration_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create material_library table
CREATE TABLE public.material_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_code TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'each',
  unit_cost DECIMAL NOT NULL DEFAULT 0,
  cost_type TEXT NOT NULL DEFAULT 'Materials',
  profit_pct DECIMAL DEFAULT 0.28,
  supplier TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create estimate_schedule table
CREATE TABLE public.estimate_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimate_projects(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.estimate_trades(id) ON DELETE CASCADE,
  wbs TEXT DEFAULT '',
  task_name TEXT NOT NULL,
  lead TEXT DEFAULT '',
  predecessor_id UUID REFERENCES public.estimate_schedule(id),
  start_date DATE,
  end_date DATE,
  work_days INTEGER DEFAULT 0,
  pct_complete DECIMAL DEFAULT 0,
  remarks TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create estimate_emails table
CREATE TABLE public.estimate_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimate_projects(id) ON DELETE CASCADE,
  email_type TEXT DEFAULT 'submission' CHECK (email_type IN ('submission','approval','followup')),
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  subject TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('sent','failed','pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.estimate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_emails ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow all authenticated users full access
CREATE POLICY "Authenticated users can do everything with estimate_projects" ON public.estimate_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything with estimate_trades" ON public.estimate_trades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything with estimate_line_items" ON public.estimate_line_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything with material_library" ON public.material_library FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read material_library" ON public.material_library FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can do everything with estimate_schedule" ON public.estimate_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything with estimate_emails" ON public.estimate_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_estimate_trades_estimate_id ON public.estimate_trades(estimate_id);
CREATE INDEX idx_estimate_line_items_trade_id ON public.estimate_line_items(trade_id);
CREATE INDEX idx_estimate_line_items_estimate_id ON public.estimate_line_items(estimate_id);
CREATE INDEX idx_estimate_schedule_estimate_id ON public.estimate_schedule(estimate_id);
CREATE INDEX idx_material_library_trade_code ON public.material_library(trade_code);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_estimate_projects_updated_at
  BEFORE UPDATE ON public.estimate_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_material_library_updated_at
  BEFORE UPDATE ON public.material_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
