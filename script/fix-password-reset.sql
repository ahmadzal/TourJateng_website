-- =============================================
-- FIX PASSWORD RESET ERROR
-- =============================================
-- Error: Database error granting user
-- Penyebab: RLS atau trigger yang memblokir auth.users saat password reset

-- LANGKAH 1: Pastikan trigger handle_new_user tidak memblokir UPDATE
-- Drop semua trigger pada auth.users yang bisa menyebabkan masalah
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS trigger_auto_award_admin_badges ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate function yang aman untuk INSERT dan UPDATE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_full_name TEXT;
    user_username TEXT;
BEGIN
    -- Hanya jalankan untuk INSERT (bukan UPDATE)
    IF TG_OP = 'UPDATE' THEN
        RETURN NEW;
    END IF;

    -- Extract metadata dengan fallback yang aman
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 8)
    );
    
    -- Log untuk debugging
    RAISE LOG 'Creating profile for user: % (%) with username: %', NEW.email, NEW.id, user_username;
    
    -- Insert hanya kolom yang wajib dan aman
    BEGIN
        INSERT INTO public.users (
            id, 
            email, 
            username,
            full_name
        )
        VALUES (
            NEW.id,
            NEW.email,
            user_username,
            user_full_name
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            updated_at = CURRENT_TIMESTAMP;
        
        RAISE LOG 'SUCCESS: Profile created/updated for %', NEW.email;
        
    EXCEPTION 
        WHEN OTHERS THEN
            -- Log error tapi jangan fail
            RAISE LOG 'Error creating profile for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
    END;
    
    RETURN NEW;
END;
$$;

-- LANGKAH 2: Create trigger HANYA untuk INSERT (bukan UPDATE)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- LANGKAH 2b: Recreate trigger untuk admin badges tapi dengan error handling yang lebih baik
-- Pastikan function auto_award_admin_granted_badges ada dan aman
CREATE OR REPLACE FUNCTION public.auto_award_admin_granted_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hanya jalankan jika user sudah punya email yang confirmed
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Coba award badges tapi jangan fail jika ada error
  BEGIN
    INSERT INTO public.user_badges (user_id, badge_id, awarded_at, awarded_by)
    SELECT 
      NEW.id,
      agb.badge_id,
      NOW(),
      'admin_granted'
    FROM public.admin_granted_badges agb
    WHERE agb.user_email = NEW.email
      AND NOT EXISTS (
        SELECT 1 FROM public.user_badges ub
        WHERE ub.user_id = NEW.id AND ub.badge_id = agb.badge_id
      );
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log tapi jangan fail
      RAISE LOG 'Error awarding admin badges for %: %', NEW.email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger tapi dengan kondisi yang lebih aman
DROP TRIGGER IF EXISTS trigger_auto_award_admin_badges ON auth.users;
CREATE TRIGGER trigger_auto_award_admin_badges
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION auto_award_admin_granted_badges();

-- LANGKAH 3: Pastikan RLS policies untuk users table tidak memblokir
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users; 
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT - user bisa lihat profil sendiri
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy untuk UPDATE - user bisa update profil sendiri
-- Pastikan ini tidak memblokir password reset
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy untuk INSERT - user bisa create profil sendiri (untuk OAuth)
CREATE POLICY "Users can insert own profile" ON public.users 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- LANGKAH 4: Update trigger untuk updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_users_updated ON public.users;
CREATE TRIGGER on_users_updated
    BEFORE UPDATE ON public.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_updated_at();

-- LANGKAH 5: Verify setup
SELECT 
    'Triggers on auth.users:' as info,
    tgname,
    tgenabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
  AND tgname NOT LIKE 'pg_%';

SELECT 
    'Policies on public.users:' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- LANGKAH 6: Test dengan user yang ada (ganti dengan email Anda)
-- Uncomment baris berikut untuk test manual:
-- SELECT id, email, email_confirmed_at, last_sign_in_at 
-- FROM auth.users 
-- WHERE email = 'your-email@example.com';

-- SELESAI
-- Sekarang coba lagi:
-- 1. JALANKAN SQL ini di Supabase SQL Editor
-- 2. Minta reset password dari halaman forgot-password dengan email BARU
-- 3. Buka email dan klik link reset
-- 4. Seharusnya tidak ada error "Database error granting user" lagi
-- 5. Jika masih error, periksa Supabase Logs untuk detail error

-- CATATAN PENTING:
-- - Link reset password lama tidak akan berfungsi
-- - Harus kirim ulang email reset setelah menjalankan SQL ini
-- - Pastikan email template di Supabase sudah diupdate (lihat README-FIX-RESET-PASSWORD.md)
