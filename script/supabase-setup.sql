-- =============================================
-- SETUP DATABASE UNTUK SUPABASE AUTHENTICATION
-- =============================================

-- 1. Buat tabel users untuk menyimpan data user
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Buat policy untuk users - user hanya bisa akses data mereka sendiri
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Buat function untuk handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Log untuk debugging
    RAISE LOG 'Creating user profile for user_id: %, email: %', NEW.id, NEW.email;
    
    -- Insert dengan error handling
    BEGIN
        INSERT INTO public.users (id, email, full_name, avatar_url)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
        );
        
        RAISE LOG 'Successfully created user profile for: %', NEW.email;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE LOG 'User profile already exists for: %', NEW.email;
        WHEN OTHERS THEN
            RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
            -- Don't fail the trigger, just log the error
    END;
    
    RETURN NEW;
END;
$$;

-- 5. Buat trigger yang akan dijalankan setelah user baru dibuat
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Buat function untuk update timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

-- 7. Buat trigger untuk auto-update updated_at
DROP TRIGGER IF EXISTS on_users_updated ON public.users;
CREATE TRIGGER on_users_updated
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 8. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- 9. Buat function untuk get user profile dengan safety check
CREATE OR REPLACE FUNCTION public.get_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.created_at,
        p.updated_at
    FROM public.users p
    WHERE p.id = user_id;
END;
$$;

-- 10. Buat function untuk update profile
CREATE OR REPLACE FUNCTION public.update_profile(
    user_id UUID,
    new_full_name TEXT DEFAULT NULL,
    new_avatar_url TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_profile public.users;
BEGIN
    -- Check if user is updating their own profile
    IF auth.uid() != user_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot update another user''s profile';
    END IF;

    UPDATE public.users 
    SET 
        full_name = COALESCE(new_full_name, full_name),
        avatar_url = COALESCE(new_avatar_url, avatar_url),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = user_id
    RETURNING * INTO updated_profile;

    RETURN updated_profile;
END;
$$;

-- 11. Function untuk debugging - cek apakah trigger bekerja
CREATE OR REPLACE FUNCTION public.check_trigger_status()
RETURNS TABLE (
    trigger_name TEXT,
    event_manipulation TEXT,
    event_object_table TEXT,
    action_statement TEXT
)
LANGUAGE sql
AS $$
    SELECT 
        t.trigger_name::TEXT,
        t.event_manipulation::TEXT,
        t.event_object_table::TEXT,
        t.action_statement::TEXT
    FROM information_schema.triggers t
    WHERE t.trigger_name = 'on_auth_user_created';
$$;

-- 12. Function untuk test insert user secara manual
CREATE OR REPLACE FUNCTION public.test_user_creation(
    test_email TEXT,
    test_full_name TEXT DEFAULT 'Test User'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_id UUID;
    result_msg TEXT;
BEGIN
    -- Generate random UUID for test
    test_id := gen_random_uuid();
    
    BEGIN
        -- Test insert ke tabel users
        INSERT INTO public.users (id, email, full_name)
        VALUES (test_id, test_email, test_full_name);
        
        result_msg := 'SUCCESS: Test user created with ID: ' || test_id;
        
        -- Clean up test data
        DELETE FROM public.users WHERE id = test_id;
        result_msg := result_msg || ' (cleaned up)';
        
    EXCEPTION WHEN OTHERS THEN
        result_msg := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN result_msg;
END;
$$;

-- =============================================
-- INSTRUKSI PENGGUNAAN:
-- =============================================
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Pastikan environment variables sudah di set:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
-- 3. Test registrasi user baru melalui aplikasi
-- 4. Cek tabel users untuk memastikan data tersimpan otomatis

-- DEBUGGING:
-- Cek status trigger: SELECT * FROM public.check_trigger_status();
-- Test manual insert: SELECT public.test_user_creation('test@example.com');
-- Lihat logs: Dashboard > Logs > Database