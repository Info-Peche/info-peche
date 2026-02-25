-- Allow admins to upload covers
CREATE POLICY "Admins can upload magazine covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'magazine-covers'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update covers
CREATE POLICY "Admins can update magazine covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'magazine-covers'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete covers
CREATE POLICY "Admins can delete magazine covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'magazine-covers'
  AND has_role(auth.uid(), 'admin'::app_role)
);