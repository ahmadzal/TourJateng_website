-- Fix untuk error komentar forum
-- File: fix-forum-comments-error.sql
-- JALANKAN SCRIPT INI DI SUPABASE SQL EDITOR

-- 1. Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS update_forum_comments_updated_at ON forum_comments;
DROP TRIGGER IF EXISTS trigger_update_comments_count ON forum_comments;

-- 2. Periksa apakah kolom updated_at ada di forum_comments
-- Jika tidak ada, tambahkan kolom tersebut
DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_comments' AND column_name = 'updated_at') THEN
        ALTER TABLE forum_comments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to forum_comments';
    ELSE
        RAISE NOTICE 'Column updated_at already exists in forum_comments';
    END IF;
END $$;

-- 3. Periksa apakah kolom image_url ada di forum_comments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_comments' AND column_name = 'image_url') THEN
        ALTER TABLE forum_comments ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to forum_comments';
    ELSE
        RAISE NOTICE 'Column image_url already exists in forum_comments';
    END IF;
END $$;

-- 4. Periksa apakah kolom likes_count ada di forum_comments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_comments' AND column_name = 'likes_count') THEN
        ALTER TABLE forum_comments ADD COLUMN likes_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added likes_count column to forum_comments';
    ELSE
        RAISE NOTICE 'Column likes_count already exists in forum_comments';
    END IF;
END $$;

-- 5. Update existing records to have proper updated_at values
UPDATE forum_comments SET updated_at = created_at WHERE updated_at IS NULL;

-- 6. Create safe trigger function for updated_at with column check
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if updated_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME 
        AND column_name = 'updated_at'
    ) INTO column_exists;
    
    -- Only update if column exists
    IF column_exists THEN
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger untuk updated_at (after ensuring column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'forum_comments' AND column_name = 'updated_at') THEN
        CREATE TRIGGER update_forum_comments_updated_at 
            BEFORE UPDATE ON forum_comments 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created updated_at trigger for forum_comments';
    ELSE
        RAISE NOTICE 'Skipped updated_at trigger - column does not exist';
    END IF;
END $$;

-- 8. Create safe function untuk comments_count
CREATE OR REPLACE FUNCTION update_forum_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT operation
  IF TG_OP = 'INSERT' THEN
    -- Ensure forum_posts table and comments_count column exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'forum_posts' AND column_name = 'comments_count') THEN
        UPDATE forum_posts 
        SET comments_count = COALESCE(comments_count, 0) + 1 
        WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  -- Handle DELETE operation
  ELSIF TG_OP = 'DELETE' THEN
    -- Ensure forum_posts table and comments_count column exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'forum_posts' AND column_name = 'comments_count') THEN
        UPDATE forum_posts 
        SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger untuk comments count
CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_comments_count();

-- 10. Fix comments count untuk posts yang sudah ada (safely)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_posts') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_comments') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'comments_count') THEN
        
        UPDATE forum_posts 
        SET comments_count = (
            SELECT COUNT(*) 
            FROM forum_comments 
            WHERE forum_comments.post_id = forum_posts.id
        );
        RAISE NOTICE 'Updated comments_count for existing posts';
    ELSE
        RAISE NOTICE 'Skipped comments_count update - required tables/columns not found';
    END IF;
END $$;

-- 11. Periksa struktur tabel final
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_comments') THEN
        RAISE NOTICE 'Forum comments table structure:';
        -- This will show in the query results
    ELSE
        RAISE NOTICE 'Forum comments table does not exist!';
    END IF;
END $$;

-- Show table structure (this will display in results)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'forum_comments' 
ORDER BY ordinal_position;

-- 12. Final success message
DO $$
BEGIN
    RAISE NOTICE '✅ Forum comments error fixes applied successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Check table structure above';
    RAISE NOTICE '2. Create storage bucket "forum-images" if needed';
    RAISE NOTICE '3. Test adding comments with text and/or images';
END $$;