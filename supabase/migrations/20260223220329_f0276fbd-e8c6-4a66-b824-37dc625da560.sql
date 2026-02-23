
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed with current edition defaults
INSERT INTO public.site_settings (key, value) VALUES
('current_edition', '{
  "issue_number": "N°100",
  "issue_period": "Janvier 2026",
  "youtube_video_id": "gwYLuVXP-Ik",
  "cover_image": "https://fokaikipfikcokjwyeka.supabase.co/storage/v1/object/public/magazine-covers/ip100-cover.png",
  "highlights": [
    "Dossier spécial : Les amorces d''hiver",
    "Test matériel : 5 cannes au banc d''essai",
    "Reportage : Championnat du monde 2024",
    "Technique : La pêche à la grande canne expliquée"
  ]
}'::jsonb);
