-- SQL Migration: Sahara Gather Connect - Admin & Hybrid Uploads
-- This script ensures the necessary columns and storage bucket exist for the new functionality.

-- 1. Ensure partner_ads has the correct columns
-- The image_url column is already TEXT, which can store both external URLs and storage paths/URLs.
-- We ensure'is_active' and other fields are consistent.

CREATE TABLE IF NOT EXISTS public.partner_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for partner_ads
ALTER TABLE public.partner_ads ENABLE ROW LEVEL SECURITY;

-- 2. Storage Bucket Creation (Manual instruction for Supabase Web Console)
-- Note: You MUST manually create a bucket named 'events' in your Supabase Project -> Storage.
-- Ensure the bucket is 'Public'.

-- 3. Storage Policies (Run this in Supabase SQL Editor AFTER creating the 'events' bucket)
-- Allow anyone to read images from the 'events' bucket
/*
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'events');

-- Allow authenticated users (Associations/Admins) to upload images
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events');

-- Allow owners to delete their images
CREATE POLICY "Owner Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'events');
*/
