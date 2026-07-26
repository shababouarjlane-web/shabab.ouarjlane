-- SQL Migration: Add Notifications History Table
-- This table stores a log of broadcasted notifications so admins can view and re-use them.

CREATE TABLE IF NOT EXISTS public.notifications_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT,
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications_history
ALTER TABLE public.notifications_history ENABLE ROW LEVEL SECURITY;

-- Allow super_admin and association users to view history
CREATE POLICY "Allow admins and associations to view notification history"
ON public.notifications_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('super_admin', 'association')
  )
);

-- Allow super_admin and association users to insert history
CREATE POLICY "Allow admins and associations to insert notification history"
ON public.notifications_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('super_admin', 'association')
  )
);
