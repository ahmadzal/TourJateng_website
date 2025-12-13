-- Simple and Safe Forum Comments Fix
-- File: simple-forum-fix.sql
-- JALANKAN SCRIPT INI DI SUPABASE SQL EDITOR jika fix-forum-comments-error.sql masih error

-- 1. Hapus trigger yang bermasalah terlebih dahulu
DROP TRIGGER IF EXISTS update_forum_comments_updated_at ON forum_comments;
DROP TRIGGER IF EXISTS trigger_update_comments_count ON forum_comments;

-- 2. Tambahkan kolom yang hilang tanpa trigger dulu
ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 3. Update data yang sudah ada
UPDATE forum_comments SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE forum_comments SET likes_count = 0 WHERE likes_count IS NULL;

-- 4. Buat function sederhana untuk updated_at
CREATE OR REPLACE FUNCTION simple_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Buat trigger untuk updated_at
CREATE TRIGGER update_forum_comments_updated_at 
    BEFORE UPDATE ON forum_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION simple_update_timestamp();

-- 6. Buat function sederhana untuk comments count
CREATE OR REPLACE FUNCTION simple_update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Buat trigger untuk comments count
CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION simple_update_comments_count();

-- 8. Fix comments count untuk posts yang ada
UPDATE forum_posts 
SET comments_count = COALESCE((
    SELECT COUNT(*) 
    FROM forum_comments 
    WHERE forum_comments.post_id = forum_posts.id
), 0);

-- 9. Test query untuk memastikan semuanya berjalan
SELECT 'Fix completed successfully! Table structure:' as message;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'forum_comments' 
ORDER BY ordinal_position;