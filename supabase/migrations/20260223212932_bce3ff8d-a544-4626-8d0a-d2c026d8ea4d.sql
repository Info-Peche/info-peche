ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS comment text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscriber_number text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_processed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS billing_address_line1 text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_address_line2 text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_city text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_postal_code text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_country text DEFAULT NULL;