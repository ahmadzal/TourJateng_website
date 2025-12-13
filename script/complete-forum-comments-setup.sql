-- Complete Forum Comments Setup Script
-- File: complete-forum-comments-setup.sql
-- JALANKAN SCRIPT INI DI SUPABASE SQL EDITOR

-- ============================================
-- 1. SETUP TABEL FORUM (jika belum ada)
-- ============================================

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'Alam',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  comments_count INTEGER DEFAULT 0
);

-- Create forum_comments table
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

-- Create forum_comment_likes table (untuk fitur masa depan)
CREATE TABLE IF NOT EXISTS forum_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_active ON forum_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_author_id ON forum_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at ON forum_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_comment_id ON forum_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_user_id ON forum_comment_likes(user_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policies for forum_posts
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view active forum posts" ON forum_posts;
    DROP POLICY IF EXISTS "Authenticated users can create forum posts" ON forum_posts;
    DROP POLICY IF EXISTS "Users can update own forum posts" ON forum_posts;
    DROP POLICY IF EXISTS "Users can delete own forum posts" ON forum_posts;
    
    -- Create new policies
    CREATE POLICY "Anyone can view active forum posts" 
      ON forum_posts FOR SELECT 
      USING (is_active = true);

    CREATE POLICY "Authenticated users can create forum posts" 
      ON forum_posts FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = author_id);

    CREATE POLICY "Users can update own forum posts" 
      ON forum_posts FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = author_id)
      WITH CHECK (auth.uid() = author_id);

    CREATE POLICY "Users can delete own forum posts" 
      ON forum_posts FOR DELETE 
      TO authenticated 
      USING (auth.uid() = author_id);
END $$;

-- Policies for forum_comments
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view forum comments" ON forum_comments;
    DROP POLICY IF EXISTS "Authenticated users can create forum comments" ON forum_comments;
    DROP POLICY IF EXISTS "Users can update own forum comments" ON forum_comments;
    DROP POLICY IF EXISTS "Users can delete own forum comments" ON forum_comments;
    
    CREATE POLICY "Anyone can view forum comments" 
      ON forum_comments FOR SELECT 
      USING (true);

    CREATE POLICY "Authenticated users can create forum comments" 
      ON forum_comments FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = author_id);

    CREATE POLICY "Users can update own forum comments" 
      ON forum_comments FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = author_id)
      WITH CHECK (auth.uid() = author_id);

    CREATE POLICY "Users can delete own forum comments" 
      ON forum_comments FOR DELETE 
      TO authenticated 
      USING (auth.uid() = author_id);
END $$;

-- Policies for forum_comment_likes
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view comment likes" ON forum_comment_likes;
    DROP POLICY IF EXISTS "Authenticated users can like comments" ON forum_comment_likes;
    DROP POLICY IF EXISTS "Users can unlike their own likes" ON forum_comment_likes;
    
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
END $$;

-- ============================================
-- 5. CREATE FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Create triggers
DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER update_forum_posts_updated_at 
  BEFORE UPDATE ON forum_posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_comments_updated_at ON forum_comments;
CREATE TRIGGER update_forum_comments_updated_at 
  BEFORE UPDATE ON forum_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_comments_count ON forum_comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_comments_count();

DROP TRIGGER IF EXISTS trigger_update_likes_count ON forum_comment_likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON forum_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- ============================================
-- 6. SETUP STORAGE BUCKET (Uncomment untuk run manual)
-- ============================================

/*
-- Membuat bucket untuk menyimpan gambar forum
INSERT INTO storage.buckets (id, name, public) 
VALUES ('forum-images', 'forum-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view forum images" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'forum-images');

CREATE POLICY "Authenticated users can upload forum images" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own forum images" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own forum images" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
*/

-- ============================================
-- 7. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Forum Comments Setup Complete!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create storage bucket "forum-images" manually in Supabase Dashboard';
    RAISE NOTICE '2. Run forum-storage-setup.sql for storage policies';
    RAISE NOTICE '3. Test with test-forum-comments.sql';
    RAISE NOTICE '4. Verify frontend integration';
END $$;