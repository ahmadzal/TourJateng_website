-- =============================================
-- COMPLETE FIX FOR FORUM POSTS TRIGGER ERROR
-- Execute this in your Supabase SQL Editor
-- =============================================

-- 1. First, drop any existing problematic trigger
DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
DROP TRIGGER IF EXISTS handle_updated_at ON forum_posts;

-- 2. Check current structure of forum_posts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'forum_posts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Add updated_at column if it doesn't exist
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
        
        -- Set initial values for existing records
        UPDATE public.forum_posts 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE '✅ Column updated_at added to forum_posts table';
    ELSE
        RAISE NOTICE '✅ Column updated_at already exists in forum_posts table';
    END IF;
END $$;

-- 4. Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_forum_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set updated_at if the column exists
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
CREATE TRIGGER update_forum_posts_updated_at
    BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_posts_updated_at();

-- 6. Test the fix
DO $$
DECLARE
    test_post_id UUID;
    before_update TIMESTAMP;
    after_update TIMESTAMP;
BEGIN
    -- Get a test post
    SELECT id INTO test_post_id 
    FROM public.forum_posts 
    LIMIT 1;
    
    IF test_post_id IS NOT NULL THEN
        -- Record time before update
        SELECT updated_at INTO before_update
        FROM public.forum_posts 
        WHERE id = test_post_id;
        
        -- Wait a moment
        PERFORM pg_sleep(0.1);
        
        -- Test the update (this should now work without error)
        UPDATE public.forum_posts 
        SET is_active = is_active 
        WHERE id = test_post_id;
        
        -- Check if updated_at changed
        SELECT updated_at INTO after_update
        FROM public.forum_posts 
        WHERE id = test_post_id;
        
        IF after_update > before_update THEN
            RAISE NOTICE '✅ TRIGGER TEST SUCCESS: updated_at changed from % to %', before_update, after_update;
        ELSE
            RAISE WARNING '❌ TRIGGER TEST FAILED: updated_at did not change';
        END IF;
    ELSE
        RAISE NOTICE '📝 No forum posts found for testing - create a post first';
    END IF;
END $$;

-- 7. Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'forum_posts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Show all triggers on forum_posts
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'forum_posts'
  AND trigger_schema = 'public';

COMMIT;