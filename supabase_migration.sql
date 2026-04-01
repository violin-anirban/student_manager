-- ============================================================
-- Supabase Migration: Firebase → Supabase
-- Run this entire script in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- 1. TABLES
-- ============================================================

CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  email TEXT,
  "displayName" TEXT,
  "photoURL" TEXT,
  role TEXT DEFAULT 'user',
  credits INTEGER DEFAULT 0,
  "classFee" INTEGER DEFAULT 600,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "classesRequests" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT REFERENCES users(uid),
  date TEXT,
  time TEXT,
  status TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "createdAtClient" TIMESTAMPTZ DEFAULT now(),
  "approvedAt" TIMESTAMPTZ,
  "declinedAt" TIMESTAMPTZ
);

CREATE TABLE "creditRequests" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "targetUserId" TEXT REFERENCES users(uid),
  amount INTEGER,
  "classFee" INTEGER,
  "paymentMethod" TEXT,
  proof TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "approvedAt" TIMESTAMPTZ
);

CREATE TABLE notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "createdBy" TEXT DEFAULT 'admin',
  "updatedAt" TIMESTAMPTZ
);

CREATE TABLE "upcomingConcerts" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue TEXT,
  date TEXT,
  time TEXT,
  location TEXT,
  "ticketURL" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "createdBy" TEXT DEFAULT 'admin',
  "updatedAt" TIMESTAMPTZ
);

CREATE TABLE "pastConcerts" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue TEXT,
  date TEXT,
  time TEXT,
  location TEXT,
  "ticketURL" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "createdBy" TEXT DEFAULT 'admin',
  "updatedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ
);

CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT,
  title TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "createdBy" TEXT DEFAULT 'admin'
);

CREATE TABLE guestlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 2. RPC FUNCTIONS (atomic batch operations)
-- ============================================================

CREATE OR REPLACE FUNCTION approve_credit_request(
  request_id UUID,
  user_id TEXT,
  credit_amount INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE users SET credits = credits + credit_amount WHERE uid = user_id;
  UPDATE "creditRequests" SET status = 'approved', "approvedAt" = now() WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_class_request(
  request_id UUID,
  user_id TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE users SET credits = credits - 1 WHERE uid = user_id;
  UPDATE "classesRequests" SET status = 'approved', "approvedAt" = now() WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classesRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "creditRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE "upcomingConcerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pastConcerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestlist ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated, anon USING (true);

-- classesRequests
CREATE POLICY "cr_select" ON "classesRequests" FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "cr_insert" ON "classesRequests" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cr_update" ON "classesRequests" FOR UPDATE TO authenticated, anon USING (true);
CREATE POLICY "cr_delete" ON "classesRequests" FOR DELETE TO authenticated, anon USING (true);

-- creditRequests
CREATE POLICY "pr_select" ON "creditRequests" FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "pr_insert" ON "creditRequests" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pr_update" ON "creditRequests" FOR UPDATE TO authenticated, anon USING (true);
CREATE POLICY "pr_delete" ON "creditRequests" FOR DELETE TO authenticated, anon USING (true);

-- notices
CREATE POLICY "n_select" ON notices FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "n_insert" ON notices FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "n_update" ON notices FOR UPDATE TO authenticated, anon USING (true);
CREATE POLICY "n_delete" ON notices FOR DELETE TO authenticated, anon USING (true);

-- upcomingConcerts
CREATE POLICY "uc_select" ON "upcomingConcerts" FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "uc_insert" ON "upcomingConcerts" FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "uc_update" ON "upcomingConcerts" FOR UPDATE TO authenticated, anon USING (true);
CREATE POLICY "uc_delete" ON "upcomingConcerts" FOR DELETE TO authenticated, anon USING (true);

-- pastConcerts
CREATE POLICY "pc_select" ON "pastConcerts" FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "pc_insert" ON "pastConcerts" FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "pc_update" ON "pastConcerts" FOR UPDATE TO authenticated, anon USING (true);
CREATE POLICY "pc_delete" ON "pastConcerts" FOR DELETE TO authenticated, anon USING (true);

-- videos
CREATE POLICY "v_select" ON videos FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "v_insert" ON videos FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "v_delete" ON videos FOR DELETE TO authenticated, anon USING (true);

-- guestlist
CREATE POLICY "g_select" ON guestlist FOR SELECT TO authenticated, anon USING (true);

-- 4. ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE "classesRequests";
ALTER PUBLICATION supabase_realtime ADD TABLE "creditRequests";
ALTER PUBLICATION supabase_realtime ADD TABLE notices;
ALTER PUBLICATION supabase_realtime ADD TABLE "upcomingConcerts";
ALTER PUBLICATION supabase_realtime ADD TABLE "pastConcerts";
ALTER PUBLICATION supabase_realtime ADD TABLE videos;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
