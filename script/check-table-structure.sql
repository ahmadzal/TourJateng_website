-- =============================================
-- SCRIPT UNTUK CEK DAN FIX STRUKTUR TABEL USERS
-- =============================================

-- 1. Cek struktur tabel users existing
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Cek constraints yang ada
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'users';

-- 3. Cek apakah ada kolom yang NOT NULL tapi tidak ada default value
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND is_nullable = 'NO'
  AND column_default IS NULL;

-- 4. Test insert manual untuk cek error
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'structure-test-' || extract(epoch from now()) || '@example.com';
    test_username TEXT := 'structtest' || extract(epoch from now())::bigint;
BEGIN
    RAISE LOG 'Testing table structure with insert...';
    
    -- Test 1: Insert dengan semua kolom yang mungkin required
    BEGIN
        INSERT INTO public.users (id, username, email, full_name, created_at, updated_at)
        VALUES (test_id, test_username, test_email, 'Structure Test User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        
        RAISE LOG 'SUCCESS: Basic insert with required fields works';
        
        -- Clean up immediately
        DELETE FROM public.users WHERE id = test_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'FAILED: Basic insert failed - %', SQLERRM;
        RAISE LOG 'This means there are missing required fields or constraints';
    END;
    
    -- Test 2: Insert dengan hanya kolom minimal
    BEGIN
        test_id := gen_random_uuid();
        test_email := 'minimal-test-' || extract(epoch from now()) || '@example.com';
        test_username := 'mintest' || extract(epoch from now())::bigint;
        
        INSERT INTO public.users (id, email) VALUES (test_id, test_email);
        
        RAISE LOG 'SUCCESS: Minimal insert (id, email) works';
        DELETE FROM public.users WHERE id = test_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'FAILED: Minimal insert failed - %', SQLERRM;
    END;
    
END;
$$;

-- 5. Cek RLS policies yang mungkin memblokir insert
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 6. Cek apakah ada trigger lain yang bisa conflict
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND event_object_table = 'users';

-- 7. Test RLS bypass (untuk admin/service role)
SET row_security = off;

DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'rls-bypass-test-' || extract(epoch from now()) || '@example.com';
BEGIN
    RAISE LOG 'Testing with RLS disabled...';
    
    INSERT INTO public.users (id, email) VALUES (test_id, test_email);
    RAISE LOG 'SUCCESS: Insert with RLS disabled works';
    
    DELETE FROM public.users WHERE id = test_id;
    RAISE LOG 'Cleanup completed';
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'FAILED even with RLS disabled: %', SQLERRM;
END;
$$;

SET row_security = on;

-- =============================================
-- POTENTIAL FIXES BERDASARKAN HASIL CEK:
-- =============================================

-- Fix 1: Jika ada kolom NOT NULL yang tidak ada default
-- ALTER TABLE public.users ALTER COLUMN column_name SET DEFAULT 'default_value';

-- Fix 2: Jika ada constraint yang terlalu ketat
-- ALTER TABLE public.users DROP CONSTRAINT constraint_name;

-- Fix 3: Jika RLS terlalu restrictive
-- DROP POLICY IF EXISTS policy_name ON public.users;
-- CREATE POLICY "Allow auth insert" ON public.users FOR INSERT WITH CHECK (true);

-- Fix 4: Jika ada trigger yang conflict
-- DROP TRIGGER IF EXISTS trigger_name ON public.users;