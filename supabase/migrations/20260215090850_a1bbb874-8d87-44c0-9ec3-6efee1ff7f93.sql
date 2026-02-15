
-- Table des commandes
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contact
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  
  -- Livraison
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'FR',
  
  -- Commande
  order_type TEXT NOT NULL CHECK (order_type IN ('subscription_digital', 'subscription_paper', 'subscription_combo', 'single_issue')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount INTEGER NOT NULL, -- en centimes
  currency TEXT NOT NULL DEFAULT 'eur',
  
  -- Paiement
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'sepa_debit', 'paypal')),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Récurrence
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: allow inserts from edge functions (service role) and anon for checkout
CREATE POLICY "Allow insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Policy: allow reading own orders by email (public for webhook updates)
CREATE POLICY "Allow select orders" ON public.orders
  FOR SELECT USING (true);

-- Policy: allow updates (for webhook status updates via service role)
CREATE POLICY "Allow update orders" ON public.orders
  FOR UPDATE USING (true);
