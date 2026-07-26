-- Sahara Gather Connect Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for User Roles
CREATE TYPE user_role AS ENUM ('super_admin', 'association', 'attendee');

-- 1. Users Table (Synchronized with auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role DEFAULT 'attendee'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: In production you would want to enable RLS here.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Super Admins can view all profiles" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Trigger to create a public.users row when a new auth.users signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'attendee');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Associations Table
CREATE TABLE public.associations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
-- Publicly readable
CREATE POLICY "Associations are readable by everyone" ON public.associations FOR SELECT USING (true);
-- Super Admins can insert
CREATE POLICY "Super Admins can insert associations" ON public.associations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
);
-- Managers can edit their own
CREATE POLICY "Managers can update their associations" ON public.associations FOR UPDATE USING (auth.uid() = manager_id);


-- 3. Events Table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  cover_image_url TEXT,
  max_capacity INTEGER,
  status TEXT DEFAULT 'active',
  gallery_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
-- Public events are readable by everyone. Assocation managers can see their own.
CREATE POLICY "Public Events are readable by everyone" ON public.events FOR SELECT USING (
  is_public = true OR auth.uid() IN (SELECT manager_id FROM public.associations WHERE id = association_id)
);
-- Association managers can insert events for their association
CREATE POLICY "Managers can insert events" ON public.events FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT manager_id FROM public.associations WHERE id = association_id)
);
-- Managers can update their events
CREATE POLICY "Managers can update events" ON public.events FOR UPDATE USING (
  auth.uid() IN (SELECT manager_id FROM public.associations WHERE id = association_id)
);
-- Managers can delete their events
CREATE POLICY "Managers can delete events" ON public.events FOR DELETE USING (
  auth.uid() IN (SELECT manager_id FROM public.associations WHERE id = association_id)
);


-- 4. RSVPs Table
CREATE TYPE rsvp_status AS ENUM ('attending', 'declined');

CREATE TABLE public.rsvps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status rsvp_status DEFAULT 'attending'::rsvp_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
-- Event Managers can see RSVPs for their events
CREATE POLICY "Managers can see RSVPs for their events" ON public.rsvps FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.associations a ON e.association_id = a.id
    WHERE e.id = event_id AND a.manager_id = auth.uid()
  )
);
-- Attendees can see their own RSVPs
CREATE POLICY "Users can see own RSVPs" ON public.rsvps FOR SELECT USING (auth.uid() = user_id);
-- Attendees can insert RSVPs
CREATE POLICY "Users can insert RSVPs" ON public.rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Attendees can update their RSVPs
CREATE POLICY "Users can update RSVPs" ON public.rsvps FOR UPDATE USING (auth.uid() = user_id);

-- 5. Helper function for admin dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  total_users INT;
  total_associations INT;
  total_events INT;
  total_rsvps INT;
BEGIN
  SELECT count(*) INTO total_users FROM public.users;
  SELECT count(*) INTO total_associations FROM public.associations;
  SELECT count(*) INTO total_events FROM public.events;
  SELECT count(*) INTO total_rsvps FROM public.rsvps;
  
  RETURN jsonb_build_object(
    'total_users', total_users,
    'total_associations', total_associations,
    'total_events', total_events,
    'total_rsvps', total_rsvps
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Heritage Archive Table
CREATE TABLE public.heritage_archive (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.heritage_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Heritage is readable by everyone" ON public.heritage_archive FOR SELECT USING (true);
CREATE POLICY "Super Admins can manage heritage" ON public.heritage_archive FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
);

-- 7. Partner Ads Table
CREATE TABLE public.partner_ads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ads are readable by everyone" ON public.partner_ads FOR SELECT USING (true);
CREATE POLICY "Super Admins can manage ads" ON public.partner_ads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
);
