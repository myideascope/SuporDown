ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS endpoint_addons INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'http',
  check_frequency INTEGER DEFAULT 5,
  timeout INTEGER DEFAULT 30,
  retry_count INTEGER DEFAULT 3,
  success_codes TEXT DEFAULT '200,201,204',
  notify_on_failure BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

alter publication supabase_realtime add table services;
