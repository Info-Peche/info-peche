-- Allow public read access to cover images in magazine-pdfs bucket
CREATE POLICY "Public can view cover images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'magazine-pdfs' AND (storage.foldername(name))[1] = 'covers');