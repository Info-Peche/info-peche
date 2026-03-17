
-- Create helper functions to get next sequence values (callable via RPC)
CREATE OR REPLACE FUNCTION public.nextval_order_number()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nextval('public.order_number_seq')::integer;
$$;

CREATE OR REPLACE FUNCTION public.nextval_subscriber_number()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nextval('public.subscriber_number_seq')::integer;
$$;
