
CREATE POLICY "Service role delete digital access"
ON public.digital_access
FOR DELETE
TO public
USING (auth.role() = 'service_role'::text);
