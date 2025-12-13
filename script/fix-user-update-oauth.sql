-- =============================================
-- FIX USER UPDATE FOR OAUTH USERS
-- =============================================

-- Pastikan kolom gender dan no_telepon ada dan nullable
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS no_telepon TEXT;

-- Pastikan RLS policies yang benar ada
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT - user bisa lihat profil sendiri
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy untuk UPDATE - user bisa update profil sendiri
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy untuk INSERT - user bisa create profil sendiri (untuk OAuth)
CREATE POLICY "Users can insert own profile" ON public.users 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Update trigger untuk auto-update updated_at (jika belum ada)
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

-- Test query untuk memastikan update bisa berjalan
-- SELECT id, email, full_name, gender, no_telepon, avatar_url FROM public.users LIMIT 5;

COMMENT ON COLUMN public.users.gender IS 'User gender: Laki-Laki or Perempuan';
COMMENT ON COLUMN public.users.no_telepon IS 'User phone number (optional)';
