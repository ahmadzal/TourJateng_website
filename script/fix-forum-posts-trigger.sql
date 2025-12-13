-- =============================================
-- FIX FORUM POSTS TRIGGER ERROR
-- Perbaiki masalah "record new has no field updated_at"
-- =============================================

-- 1. Drop existing trigger yang bermasalah
DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;

-- 2. Cek apakah kolom updated_at ada di forum_posts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'forum_posts' 
  AND table_schema = 'public'
  AND column_name = 'updated_at';

-- 3. Tambahkan kolom updated_at jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'forum_posts' 
          AND table_schema = 'public' 
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.forum_posts 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Set nilai awal untuk existing records
        UPDATE public.forum_posts 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE 'Column updated_at added to forum_posts table';
    ELSE
        RAISE NOTICE 'Column updated_at already exists in forum_posts table';
    END IF;
END $$;

-- 4. Buat fungsi update timestamp yang benar
CREATE OR REPLACE FUNCTION update_forum_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Set updated_at ke waktu sekarang pada UPDATE
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Buat trigger baru yang benar
CREATE TRIGGER update_forum_posts_updated_at
    BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_posts_updated_at();

-- 6. Test update untuk memastikan trigger berfungsi
DO $$
DECLARE
    test_post_id UUID;
    before_update TIMESTAMP;
    after_update TIMESTAMP;
BEGIN
    -- Ambil post pertama untuk test
    SELECT id INTO test_post_id 
    FROM public.forum_posts 
    LIMIT 1;
    
    IF test_post_id IS NOT NULL THEN
        -- Catat waktu sebelum update
        SELECT updated_at INTO before_update
        FROM public.forum_posts 
        WHERE id = test_post_id;
        
        -- Tunggu sebentar agar timestamp berbeda
        PERFORM pg_sleep(0.1);
        
        -- Test update
        UPDATE public.forum_posts 
        SET is_active = is_active 
        WHERE id = test_post_id;
        
        -- Cek apakah updated_at berubah
        SELECT updated_at INTO after_update
        FROM public.forum_posts 
        WHERE id = test_post_id;
        
        IF after_update > before_update THEN
            RAISE NOTICE 'Trigger test SUCCESS: updated_at changed from % to %', before_update, after_update;
        ELSE
            RAISE WARNING 'Trigger test FAILED: updated_at did not change';
        END IF;
    ELSE
        RAISE NOTICE 'No forum posts found for testing';
    END IF;
END $$;

COMMIT;