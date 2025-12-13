-- Quick Database Check and Fix for Forum Comments
-- File: quick-forum-fix.sql
-- JALANKAN INI TERLEBIH DAHULU DI SUPABASE SQL EDITOR

-- 1. Check if forum_comments table exists and create if needed
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  content TEXT,
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT,
  likes_count INTEGER DEFAULT 0
);

-- 2. Add missing columns if they don't exist
ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 3. Update existing records
UPDATE forum_comments SET updated_at = created_at WHERE updated_at IS NULL;

-- 4. Enable RLS if not enabled
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- 5. Create basic RLS policies
DROP POLICY IF EXISTS "Anyone can view forum comments" ON forum_comments;
CREATE POLICY "Anyone can view forum comments" 
  ON forum_comments FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create forum comments" ON forum_comments;
CREATE POLICY "Authenticated users can create forum comments" 
  ON forum_comments FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = author_id);

-- 6. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_forum_comments_updated_at ON forum_comments;
CREATE TRIGGER update_forum_comments_updated_at 
    BEFORE UPDATE ON forum_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function for comments count
CREATE OR REPLACE FUNCTION update_forum_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for comments count
DROP TRIGGER IF EXISTS trigger_update_comments_count ON forum_comments;
CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_comments_count();

-- 10. Create storage bucket (if needed, might need to be done manually)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('forum-images', 'forum-images', true)
ON CONFLICT (id) DO NOTHING;

-- Done!
SELECT 'Database setup complete! You can now test adding comments.' as message;