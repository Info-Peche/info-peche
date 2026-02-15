
-- Add physical stock management columns to digital_issues
ALTER TABLE public.digital_issues 
ADD COLUMN IF NOT EXISTS physical_stock integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS physical_price_cents integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.digital_issues.physical_stock IS 'Number of physical copies in stock. NULL means not available for physical purchase.';
COMMENT ON COLUMN public.digital_issues.physical_price_cents IS 'Price in cents for physical copy (e.g. 500 = 5€)';
COMMENT ON COLUMN public.digital_issues.is_archived IS 'True for back issues shown in the archive shop';
