-- SQL Migration: Add Push Notifications Subscriptions Table
-- This table stores PWA web push subscription objects for registered users and guest visitors.

CREATE TABLE IF NOT EXISTS public.notifications_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NULL, -- Nullable to allow guest subscriptions
    endpoint TEXT UNIQUE NOT NULL,
    keys_auth TEXT NOT NULL,
    keys_p256dh TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications_subscriptions
ALTER TABLE public.notifications_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert subscription data)
CREATE POLICY "Allow public subscriptions creation" 
ON public.notifications_subscriptions FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to view/manage their own subscriptions
CREATE POLICY "Allow users to view their own subscriptions" 
ON public.notifications_subscriptions FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins/associations to select subscriptions for broadcasting
CREATE POLICY "Allow managers and admins to view subscriptions"
ON public.notifications_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('super_admin', 'association')
  )
);
