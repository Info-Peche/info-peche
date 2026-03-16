
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  country text DEFAULT 'FR',
  subscription_type text,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  is_active_subscriber boolean DEFAULT false,
  total_orders integer DEFAULT 0,
  total_spent integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read clients" ON public.clients FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role insert clients" ON public.clients FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role update clients" ON public.clients FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role select clients" ON public.clients FOR SELECT USING (auth.role() = 'service_role');

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.upsert_client(
  _email text,
  _first_name text DEFAULT NULL,
  _last_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _address_line1 text DEFAULT NULL,
  _address_line2 text DEFAULT NULL,
  _city text DEFAULT NULL,
  _postal_code text DEFAULT NULL,
  _country text DEFAULT 'FR',
  _subscription_type text DEFAULT NULL,
  _subscription_start_date timestamptz DEFAULT NULL,
  _subscription_end_date timestamptz DEFAULT NULL,
  _is_active_subscriber boolean DEFAULT false,
  _order_total integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.clients (email, first_name, last_name, phone, address_line1, address_line2, city, postal_code, country, subscription_type, subscription_start_date, subscription_end_date, is_active_subscriber, total_orders, total_spent)
  VALUES (LOWER(_email), _first_name, _last_name, _phone, _address_line1, _address_line2, _city, _postal_code, _country, _subscription_type, _subscription_start_date, _subscription_end_date, _is_active_subscriber, 1, _order_total)
  ON CONFLICT (email) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, clients.first_name),
    last_name = COALESCE(EXCLUDED.last_name, clients.last_name),
    phone = COALESCE(EXCLUDED.phone, clients.phone),
    address_line1 = COALESCE(EXCLUDED.address_line1, clients.address_line1),
    address_line2 = COALESCE(EXCLUDED.address_line2, clients.address_line2),
    city = COALESCE(EXCLUDED.city, clients.city),
    postal_code = COALESCE(EXCLUDED.postal_code, clients.postal_code),
    country = COALESCE(EXCLUDED.country, clients.country),
    subscription_type = COALESCE(EXCLUDED.subscription_type, clients.subscription_type),
    subscription_start_date = COALESCE(EXCLUDED.subscription_start_date, clients.subscription_start_date),
    subscription_end_date = COALESCE(EXCLUDED.subscription_end_date, clients.subscription_end_date),
    is_active_subscriber = COALESCE(EXCLUDED.is_active_subscriber, clients.is_active_subscriber),
    total_orders = clients.total_orders + 1,
    total_spent = clients.total_spent + _order_total;
END;
$$;
