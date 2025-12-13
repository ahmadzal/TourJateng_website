-- =============================================
-- QUICK FIX SCRIPT UNTUK DATABASE ERROR
-- =============================================

-- 1. Drop dan recreate trigger jika bermasalah
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop dan recreate function dengan error handling yang lebih baik
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Recreate function dengan logging yang lebih detail sesuai struktur tabel existing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_full_name TEXT;
    user_avatar_url TEXT;
    user_username TEXT;
BEGIN
    -- Extract metadata with null checks
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    user_avatar_url := COALESCE(NEW.raw_user_meta_data->>'avatar_url', '');
    user_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    
    -- Log the attempt
    RAISE LOG 'Trigger fired for user: % with email: %', NEW.id, NEW.email;
    RAISE LOG 'Metadata - full_name: %, username: %, avatar_url: %', user_full_name, user_username, user_avatar_url;
    
    -- Attempt insert with detailed error handling sesuai struktur tabel existing
    BEGIN
        INSERT INTO public.users (
            id, 
            username, 
            email, 
            full_name, 
            avatar_url, 
            created_at, 
            updated_at,
            no_telepon,
            jenis_kelamin
        )
        VALUES (
            NEW.id,
            user_username,
            NEW.email,
            user_full_name,
            user_avatar_url,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            NULL, -- no_telepon default null
            NULL  -- jenis_kelamin default null
        );
        
        RAISE LOG 'SUCCESS: User profile created for % with username %', NEW.email, user_username;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE LOG 'WARNING: User profile already exists for %', NEW.email;
            -- Update existing record instead
            UPDATE public.users 
            SET 
                email = NEW.email,
                full_name = user_full_name,
                avatar_url = user_avatar_url,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;
            RAISE LOG 'Updated existing profile for %', NEW.email;
            
        WHEN not_null_violation THEN
            RAISE LOG 'ERROR: Null constraint violation for %: %', NEW.email, SQLERRM;
            -- Try insert with minimal required fields
            INSERT INTO public.users (id, email, username, created_at, updated_at)
            VALUES (NEW.id, NEW.email, user_username, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO NOTHING;
            RAISE LOG 'Inserted with minimal data for %', NEW.email;
            
        WHEN OTHERS THEN
            RAISE LOG 'ERROR: Unexpected error for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
            -- Don't fail the auth process, just log
    END;
    
    RETURN NEW;
END;
$$;

-- 4. Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Test function manually dengan struktur tabel yang benar
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    test_email TEXT := 'test-' || extract(epoch from now()) || '@example.com';
    test_username TEXT := 'testuser' || extract(epoch from now())::bigint;
BEGIN
    -- Simulate trigger execution
    RAISE LOG 'Testing trigger function manually...';
    
    -- This would normally be called by the trigger - sesuai struktur tabel existing
    INSERT INTO public.users (id, username, email, full_name, created_at, updated_at)
    VALUES (test_id, test_username, test_email, 'Manual Test User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    
    RAISE LOG 'Manual test successful for % with username %', test_email, test_username;
    
    -- Clean up
    DELETE FROM public.users WHERE id = test_id;
    RAISE LOG 'Test cleanup completed';
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Manual test failed: %', SQLERRM;
END;
$$;

-- 7. Check table structure
\d public.users;

-- 8. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- =============================================
-- INSTRUKSI TROUBLESHOOTING:
-- =============================================
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Cek logs di Dashboard > Logs > Database
-- 3. Test registrasi user baru
-- 4. Jika masih error, jalankan query berikut:

-- Cek apakah trigger aktif:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Cek structure tabel users:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users';

-- Cek RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Test manual insert (sesuai struktur tabel existing):
-- INSERT INTO public.users (id, username, email, full_name) VALUES (gen_random_uuid(), 'testuser', 'test@test.com', 'Test User');