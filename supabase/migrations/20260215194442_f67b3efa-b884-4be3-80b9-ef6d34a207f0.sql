
-- Add avatar_url column to reviews
ALTER TABLE public.reviews ADD COLUMN avatar_url text;

-- Create public bucket for review avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('review-avatars', 'review-avatars', true);

-- Allow anyone to upload to review-avatars bucket
CREATE POLICY "Anyone can upload review avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-avatars');

-- Allow public read on review-avatars
CREATE POLICY "Public can read review avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-avatars');
