-- GYMOS - Complete Database Schema
-- Run this in Supabase SQL Editor

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS service_assignments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- PROFILES (admin users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- PLANS
CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SERVICES
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MEMBERS
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL,
  weight DECIMAL(5,1),
  height DECIMAL(5,1),
  gender TEXT,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_members_member_id ON members(member_id);
CREATE INDEX idx_members_name ON members(full_name);
CREATE INDEX idx_members_phone ON members(phone);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  plan_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  services_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_member ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SERVICE ASSIGNMENTS
CREATE TABLE service_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON service_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PAYMENTS
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'service', 'renewal', 'other')),
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_date ON payments(paid_at);
CREATE INDEX idx_payments_type ON payments(payment_type);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SETTINGS
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_name TEXT DEFAULT 'GYMOS',
  gym_logo TEXT,
  gym_phone TEXT,
  gym_address TEXT,
  currency TEXT DEFAULT 'USD',
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN DEFAULT false,
  related_member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STORAGE BUCKET for member photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Give public access to member-photos" ON storage.objects;
CREATE POLICY "Give public access to member-photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'member-photos');

DROP POLICY IF EXISTS "Allow authenticated uploads to member-photos" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to member-photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'member-photos');

DROP POLICY IF EXISTS "Allow authenticated deletes from member-photos" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from member-photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'member-photos');

-- DEFAULT DATA
INSERT INTO plans (name, duration_days, price, description, color) VALUES
  ('1 Month', 30, 49.00, 'Perfect for trying out our facilities', '#3b82f6'),
  ('3 Months', 90, 129.00, 'Our most popular plan', '#10b981'),
  ('6 Months', 180, 199.00, 'Best value for dedicated members', '#f59e0b'),
  ('12 Months', 365, 349.00, 'Ultimate commitment, best savings', '#8b5cf6');

INSERT INTO services (name, price, description) VALUES
  ('Locker', 10.00, 'Personal locker rental'),
  ('Personal Trainer', 50.00, 'One-on-one training sessions'),
  ('Swimming', 30.00, 'Pool access'),
  ('Nutrition Plan', 25.00, 'Personalized nutrition guidance'),
  ('Steam Room', 20.00, 'Steam room access'),
  ('Sauna', 20.00, 'Sauna access'),
  ('Cardio Zone', 15.00, 'Advanced cardio equipment access'),
  ('Massage', 40.00, 'Professional massage session');

INSERT INTO settings (gym_name, currency, theme) VALUES ('GYMOS', 'EGP', 'dark');
