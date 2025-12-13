-- Quick fix untuk masalah forum status update
-- Error: record "new" has no field "updated_at"

-- 1. Drop semua trigger yang bermasalah pada forum_posts
DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;

-- 2. Drop function yang bermasalah jika ada
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. Tambahkan kolom updated_at jika belum ada
ALTER TABLE forum_posts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Set nilai awal untuk existing records
UPDATE forum_posts SET updated_at = created_at WHERE updated_at IS NULL;

-- 5. Buat function trigger baru yang benar
CREATE OR REPLACE FUNCTION update_forum_posts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Buat trigger baru
CREATE TRIGGER forum_posts_update_timestamp
    BEFORE UPDATE ON forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_posts_timestamp();