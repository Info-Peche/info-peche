-- Create a public bucket for magazine covers
INSERT INTO storage.buckets (id, name, public) VALUES ('magazine-covers', 'magazine-covers', true);

-- Allow public read access
CREATE POLICY "Public can view magazine covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'magazine-covers');