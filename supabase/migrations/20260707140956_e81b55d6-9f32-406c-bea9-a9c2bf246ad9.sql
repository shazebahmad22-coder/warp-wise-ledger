
-- Shared factory data: any authenticated user (owner/staff) can read+write all rows.

CREATE TABLE public.jobworkers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobworkers TO authenticated;
GRANT ALL ON public.jobworkers TO service_role;
ALTER TABLE public.jobworkers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all jobworkers" ON public.jobworkers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.machines (
  id TEXT PRIMARY KEY,
  jobworker_id TEXT NOT NULL REFERENCES public.jobworkers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO authenticated;
GRANT ALL ON public.machines TO service_role;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all machines" ON public.machines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.qualities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rate_per_piece NUMERIC NOT NULL DEFAULT 0,
  deduction NUMERIC NOT NULL DEFAULT 0,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualities TO authenticated;
GRANT ALL ON public.qualities TO service_role;
ALTER TABLE public.qualities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all qualities" ON public.qualities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.beams (
  id TEXT PRIMARY KEY,
  jobworker_id TEXT NOT NULL REFERENCES public.jobworkers(id) ON DELETE CASCADE,
  machine_id TEXT NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  beam_number TEXT NOT NULL,
  warp_weight_kg NUMERIC NOT NULL DEFAULT 0,
  assigned_date TIMESTAMPTZ NOT NULL,
  prep_charge NUMERIC NOT NULL DEFAULT 0,
  closed BOOLEAN NOT NULL DEFAULT false,
  closed_date TIMESTAMPTZ,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beams TO authenticated;
GRANT ALL ON public.beams TO service_role;
ALTER TABLE public.beams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all beams" ON public.beams FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.submissions (
  id TEXT PRIMARY KEY,
  week_ending TIMESTAMPTZ NOT NULL,
  jobworker_id TEXT NOT NULL REFERENCES public.jobworkers(id) ON DELETE CASCADE,
  machine_id TEXT NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  beam_id TEXT NOT NULL REFERENCES public.beams(id) ON DELETE CASCADE,
  quality_id TEXT NOT NULL REFERENCES public.qualities(id) ON DELETE RESTRICT,
  pieces NUMERIC NOT NULL DEFAULT 0,
  weight_kg NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all submissions" ON public.submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ledger (
  id TEXT PRIMARY KEY,
  jobworker_id TEXT NOT NULL REFERENCES public.jobworkers(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger TO authenticated;
GRANT ALL ON public.ledger TO service_role;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all ledger" ON public.ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  factory_name TEXT NOT NULL DEFAULT 'My Factory',
  default_beam_prep_charge NUMERIC NOT NULL DEFAULT 200,
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all settings" ON public.app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
