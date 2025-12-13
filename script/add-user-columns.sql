-- Add missing columns to users table
-- This adds gender, no_telepon, and id_number columns

-- Add gender column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add no_telepon column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS no_telepon TEXT;

-- Add id_number column (optional, as it's usually the same as id)
-- If you want a different format of ID, uncomment this:
-- ALTER TABLE public.users 
-- ADD COLUMN IF NOT EXISTS id_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.gender IS 'User gender: Laki-Laki or Perempuan';
COMMENT ON COLUMN public.users.no_telepon IS 'User phone number';
