-- Default preview pages to 6 (aligned with archives)
ALTER TABLE public.digital_issues ALTER COLUMN preview_pages SET DEFAULT 6;
UPDATE public.digital_issues SET preview_pages = 6 WHERE preview_pages IS NULL OR preview_pages = 4;
