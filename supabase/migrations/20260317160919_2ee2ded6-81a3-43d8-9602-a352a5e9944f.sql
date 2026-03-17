
ALTER TABLE public.blog_articles ADD COLUMN status text NOT NULL DEFAULT 'published';

-- Set all existing articles as published
UPDATE public.blog_articles SET status = 'published' WHERE status IS NULL OR status = 'published';
