-- SQL untuk menambahkan fitur komentar yang diperbaiki
-- File: forum-comments-enhancement.sql

-- Menambahkan kolom image_url ke tabel forum_comments jika belum ada
ALTER TABLE forum_comments 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Menambahkan kolom likes_count untuk fitur like komentar (opsional)
ALTER TABLE forum_comments 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Membuat tabel untuk menyimpan like pada komentar (opsional untuk fitur masa depan)
CREATE TABLE IF NOT EXISTS forum_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Membuat storage bucket untuk gambar forum jika belum ada
-- Note: Ini harus dijalankan melalui Supabase Dashboard atau menggunakan SQL editor
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('forum-images', 'forum-images', true);

-- Menambahkan policy untuk storage bucket forum-images
-- CREATE POLICY "Anyone can view forum images" 
--   ON storage.objects FOR SELECT 
--   USING (bucket_id = 'forum-images');

-- CREATE POLICY "Authenticated users can upload forum images" 
--   ON storage.objects FOR INSERT 
--   TO authenticated 
--   WITH CHECK (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update their own forum images" 
--   ON storage.objects FOR UPDATE 
--   TO authenticated 
--   USING (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own forum images" 
--   ON storage.objects FOR DELETE 
--   TO authenticated 
--   USING (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_comment_id ON forum_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_user_id ON forum_comment_likes(user_id);

-- RLS Policies untuk forum_comment_likes
ALTER TABLE forum_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes" 
  ON forum_comment_likes FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can like comments" 
  ON forum_comment_likes FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
  ON forum_comment_likes FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Function untuk update comments_count pada forum_posts
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

-- Trigger untuk otomatis update comments_count
DROP TRIGGER IF EXISTS trigger_update_comments_count ON forum_comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_comments_count();

-- Function untuk update likes_count pada forum_comments
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_comments 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk otomatis update likes_count
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON forum_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Menambahkan beberapa sample komentar untuk testing
INSERT INTO forum_comments (post_id, content, author, author_id) VALUES
  (
    (SELECT id FROM forum_posts LIMIT 1),
    'Wah, saya juga penasaran nih! Kayaknya Semarang punya banyak tempat menarik yang belum terjamah.',
    'Test User',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    (SELECT id FROM forum_posts LIMIT 1),
    'Coba ke Kampung Pelangi, tempatnya Instagram-able banget! Dan jangan lupa kulineran di Gang Lombok.',
    'Test User 2',
    '00000000-0000-0000-0000-000000000003'
  );