CREATE OR REPLACE FUNCTION public.decrement_stock(_issue_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE digital_issues
  SET physical_stock = GREATEST(COALESCE(physical_stock, 0) - 1, 0)
  WHERE id = _issue_id
    AND physical_stock IS NOT NULL
    AND physical_stock > 0;
END;
$$;