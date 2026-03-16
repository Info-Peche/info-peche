
CREATE TABLE public.fishing_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'plan_eau',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  department text,
  city text,
  description text,
  issue_number text,
  google_maps_url text,
  fish_species text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.fishing_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read fishing spots" ON public.fishing_spots
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert fishing spots" ON public.fishing_spots
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update fishing spots" ON public.fishing_spots
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete fishing spots" ON public.fishing_spots
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
