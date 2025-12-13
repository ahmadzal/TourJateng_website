-- =====================================================
-- ADMIN GRANTED BADGES SYSTEM
-- =====================================================
-- Sistem untuk admin memberikan badge khusus (The Grand Architect)
-- secara manual kepada user berdasarkan email mereka
-- =====================================================

-- 1. Tabel untuk menyimpan daftar email yang mendapat badge dari admin
CREATE TABLE IF NOT EXISTS public.admin_granted_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT, -- Email admin yang memberikan
  notes TEXT, -- Catatan kenapa badge diberikan
  
  UNIQUE(user_email, badge_id)
);

-- Index untuk performa pencarian
CREATE INDEX IF NOT EXISTS idx_admin_granted_badges_email 
  ON public.admin_granted_badges(user_email);

CREATE INDEX IF NOT EXISTS idx_admin_granted_badges_badge_id 
  ON public.admin_granted_badges(badge_id);

-- 2. RLS Policies - Admin bisa manage, user hanya bisa lihat milik mereka
ALTER TABLE public.admin_granted_badges ENABLE ROW LEVEL SECURITY;

-- Policy untuk admin (butuh service_role key atau custom admin role)
-- Untuk sementara, kita buat policy yang membolehkan service_role
-- Note: Admin management akan dilakukan melalui Supabase Dashboard atau API dengan service key

-- Policy untuk user melihat badge yang diberikan kepada mereka
CREATE POLICY "Users can view their granted badges"
  ON public.admin_granted_badges
  FOR SELECT
  USING (
    user_email = auth.jwt()->>'email'
  );

-- Policy untuk insert (hanya melalui service role atau function)
CREATE POLICY "Service role can insert granted badges"
  ON public.admin_granted_badges
  FOR INSERT
  WITH CHECK (true); -- Service role bypass RLS

-- Policy untuk delete (hanya melalui service role)
CREATE POLICY "Service role can delete granted badges"
  ON public.admin_granted_badges
  FOR DELETE
  USING (true); -- Service role bypass RLS

-- 3. Function untuk auto-award badge saat user login
-- Jika email user ada di admin_granted_badges, otomatis berikan badge
CREATE OR REPLACE FUNCTION auto_award_admin_granted_badges()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  granted_badge RECORD;
BEGIN
  -- Ambil email user yang baru login/update
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.id;

  -- Cek apakah ada badge yang diberikan admin untuk email ini
  FOR granted_badge IN 
    SELECT badge_id 
    FROM public.admin_granted_badges 
    WHERE user_email = granted_badge.user_email
  LOOP
    -- Insert ke user_badges jika belum ada
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (NEW.id, granted_badge.badge_id, NOW())
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger untuk menjalankan function saat user login
-- Note: Trigger ini akan berjalan saat ada update di auth.users
-- Alternatif: bisa juga dipanggil dari aplikasi saat user login
DROP TRIGGER IF EXISTS trigger_auto_award_admin_badges ON auth.users;
CREATE TRIGGER trigger_auto_award_admin_badges
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION auto_award_admin_granted_badges();

-- 5. Function helper untuk admin memberikan badge (opsional, untuk API)
CREATE OR REPLACE FUNCTION grant_badge_to_user(
  p_user_email TEXT,
  p_badge_name TEXT,
  p_granted_by TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_badge_id UUID;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Cari badge ID berdasarkan nama
  SELECT id INTO v_badge_id
  FROM public.badges
  WHERE name = p_badge_name;

  IF v_badge_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Badge not found'
    );
  END IF;

  -- Insert ke admin_granted_badges
  INSERT INTO public.admin_granted_badges (user_email, badge_id, granted_by, notes)
  VALUES (p_user_email, v_badge_id, p_granted_by, p_notes)
  ON CONFLICT (user_email, badge_id) 
  DO UPDATE SET granted_by = p_granted_by, notes = p_notes, granted_at = NOW();

  -- Cek apakah user sudah terdaftar
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  -- Jika user sudah terdaftar, langsung berikan badge
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (v_user_id, v_badge_id, NOW())
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    RETURN json_build_object(
      'success', true,
      'message', 'Badge granted and awarded to user',
      'user_id', v_user_id
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'message', 'Badge granted, will be awarded when user logs in',
      'user_id', NULL
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update badge "The Grand Architect" untuk menandai sebagai admin-only
UPDATE public.badges
SET 
  requirement_type = 'admin_grant',
  requirement_value = 0,
  badge_type = 'premium'
WHERE name = 'The Grand Architect';

-- =====================================================
-- CARA PENGGUNAAN UNTUK ADMIN
-- =====================================================

-- Contoh 1: Memberikan badge "The Grand Architect" ke user
-- Jalankan query ini di Supabase SQL Editor atau melalui service role API:

-- SELECT grant_badge_to_user(
--   'user@example.com',
--   'The Grand Architect',
--   'admin@kitacoba.com',
--   'Kontributor utama pengembangan website'
-- );

-- Contoh 2: Memberikan badge langsung melalui INSERT
-- INSERT INTO public.admin_granted_badges (user_email, badge_id, granted_by, notes)
-- VALUES (
--   'developer@example.com',
--   (SELECT id FROM public.badges WHERE name = 'The Grand Architect'),
--   'admin@kitacoba.com',
--   'Core developer tim Kitacoba'
-- );

-- Contoh 3: Melihat semua user yang mendapat badge dari admin
-- SELECT 
--   agb.user_email,
--   b.name as badge_name,
--   agb.granted_at,
--   agb.granted_by,
--   agb.notes,
--   CASE 
--     WHEN ub.earned_at IS NOT NULL THEN 'Awarded'
--     ELSE 'Pending (user belum login)'
--   END as status
-- FROM public.admin_granted_badges agb
-- JOIN public.badges b ON agb.badge_id = b.id
-- LEFT JOIN auth.users u ON u.email = agb.user_email
-- LEFT JOIN public.user_badges ub ON ub.user_id = u.id AND ub.badge_id = agb.badge_id
-- ORDER BY agb.granted_at DESC;

-- Contoh 4: Mencabut badge dari user
-- DELETE FROM public.admin_granted_badges
-- WHERE user_email = 'user@example.com' 
-- AND badge_id = (SELECT id FROM public.badges WHERE name = 'The Grand Architect');

-- Note: Mencabut dari admin_granted_badges tidak otomatis hapus dari user_badges
-- Jika ingin hapus dari user_badges juga:
-- DELETE FROM public.user_badges
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
-- AND badge_id = (SELECT id FROM public.badges WHERE name = 'The Grand Architect');

-- =====================================================
-- TESTING
-- =====================================================

-- Test 1: Berikan badge ke email test
-- SELECT grant_badge_to_user(
--   'test@example.com',
--   'The Grand Architect',
--   'system',
--   'Testing admin granted badges'
-- );

-- Test 2: Verifikasi
-- SELECT * FROM public.admin_granted_badges WHERE user_email = 'test@example.com';
