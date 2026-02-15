
-- Table for customer reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_location TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Public can read approved reviews"
ON public.reviews
FOR SELECT
USING (is_approved = true);

-- Anyone can submit a review (moderated)
CREATE POLICY "Anyone can submit a review"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Admins can manage reviews
CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can read all reviews (including unapproved)
CREATE POLICY "Admins can read all reviews"
ON public.reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
