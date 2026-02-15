-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Blog articles table
CREATE TABLE public.blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  cover_image text,
  category text DEFAULT 'technique',
  is_free boolean NOT NULL DEFAULT false,
  paywall_preview_length int DEFAULT 500,
  related_issue_id uuid,
  author text DEFAULT 'Info Pêche',
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read articles" ON public.blog_articles FOR SELECT USING (true);
CREATE POLICY "Admins can insert articles" ON public.blog_articles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update articles" ON public.blog_articles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete articles" ON public.blog_articles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_blog_articles_updated_at BEFORE UPDATE ON public.blog_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Digital issues table
CREATE TABLE public.digital_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  issue_number text NOT NULL,
  description text,
  cover_image text,
  pdf_url text,
  youtube_video_url text,
  preview_pages int DEFAULT 4,
  price_cents int DEFAULT 300,
  is_current boolean DEFAULT false,
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.digital_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read digital issues" ON public.digital_issues FOR SELECT USING (true);
CREATE POLICY "Admins can insert digital issues" ON public.digital_issues FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update digital issues" ON public.digital_issues FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Digital access purchases
CREATE TABLE public.digital_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  access_type text NOT NULL,
  issue_id uuid REFERENCES public.digital_issues(id),
  expires_at timestamp with time zone NOT NULL,
  stripe_checkout_session_id text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.digital_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role insert digital access" ON public.digital_access FOR INSERT WITH CHECK (auth.role() = 'service_role'::text);
CREATE POLICY "Service role select digital access" ON public.digital_access FOR SELECT USING (auth.role() = 'service_role'::text);

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('magazine-pdfs', 'magazine-pdfs', false) ON CONFLICT (id) DO NOTHING;
