
-- Drop overly permissive policies
DROP POLICY "Allow insert orders" ON public.orders;
DROP POLICY "Allow update orders" ON public.orders;

-- Only service_role can insert (edge functions)
CREATE POLICY "Service role insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Only service_role can update (webhooks)
CREATE POLICY "Service role update orders" ON public.orders
  FOR UPDATE USING (auth.role() = 'service_role');
