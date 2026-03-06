
-- Create authors table
CREATE TABLE public.blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  description text,
  external_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

-- Public can read authors
CREATE POLICY "Public can read authors" ON public.blog_authors
  FOR SELECT TO authenticated, anon USING (true);

-- Admins can manage authors
CREATE POLICY "Admins can insert authors" ON public.blog_authors
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update authors" ON public.blog_authors
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete authors" ON public.blog_authors
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Insert default author
INSERT INTO public.blog_authors (name, description) VALUES ('Info Pêche', 'Rédaction Info Pêche');

-- Create storage bucket for author avatars (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('author-avatars', 'author-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for author avatars
CREATE POLICY "Public can read author avatars" ON storage.objects
  FOR SELECT TO authenticated, anon USING (bucket_id = 'author-avatars');

CREATE POLICY "Admins can upload author avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'author-avatars' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update author avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'author-avatars' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete author avatars" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'author-avatars' AND has_role(auth.uid(), 'admin'));
