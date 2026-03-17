
-- Auto-incrementing order number
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number integer;

-- Subscriber number sequence and column on clients
CREATE SEQUENCE IF NOT EXISTS public.subscriber_number_seq START WITH 1;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS subscriber_number text;
