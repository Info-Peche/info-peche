ALTER TABLE public.blog_articles ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.blog_articles ADD COLUMN IF NOT EXISTS display_order integer DEFAULT NULL;