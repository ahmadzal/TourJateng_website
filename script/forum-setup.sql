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
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_active ON forum_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_author_id ON forum_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at ON forum_comments(created_at);

-- Enable Row Level Security
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_posts
-- Allow everyone to read active posts
CREATE POLICY "Anyone can view active forum posts" 
  ON forum_posts FOR SELECT 
  USING (is_active = true);

-- Allow authenticated users to insert posts
CREATE POLICY "Authenticated users can create forum posts" 
  ON forum_posts FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own forum posts" 
  ON forum_posts FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own forum posts" 
  ON forum_posts FOR DELETE 
  TO authenticated 
  USING (auth.uid() = author_id);

-- RLS Policies for forum_comments
-- Allow everyone to read comments
CREATE POLICY "Anyone can view forum comments" 
  ON forum_comments FOR SELECT 
  USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Authenticated users can create forum comments" 
  ON forum_comments FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update own forum comments" 
  ON forum_comments FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own forum comments" 
  ON forum_comments FOR DELETE 
  TO authenticated 
  USING (auth.uid() = author_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_forum_posts_updated_at 
  BEFORE UPDATE ON forum_posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_comments_updated_at 
  BEFORE UPDATE ON forum_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO forum_posts (title, content, author, author_id, category, comments_count) VALUES
  (
    'Pertama Kali ke Semarang, Ada Rekomendasi Tempat Wajib?',
    'Halo semua! Minggu depan aku mau jalan-jalan ke Semarang untuk pertama kalinya. Selain Lawang Sewu dan Kota Lama, ada spot unik lain yang harus....',
    'Sarah Lee',
    '00000000-0000-0000-0000-000000000001',
    'Alam',
    1
  ),
  (
    'Pengalaman Sunrise di Candi Gedong Songo',
    'Baru pulang dari Bandungan dan mampir ke Candi Gedong Songo. Gila sih view sunrise-nya kerennn banget! Ada yang punya rekomendasi spot lain di ....',
    'Sarah Lee',
    '00000000-0000-0000-0000-000000000001',
    'Alam',
    2
  ),
  (
    'Cari Spot Hidden Gem di Kendal!',
    'Aku akhir-akhir ini lagi suka banget eksplor tempat-tempat wisata yang belum terlalu ramai dan masih alami. Rasanya seru gja kalau bisa nemuin desti.....',
    'Sarah Lee',
    '00000000-0000-0000-0000-000000000001',
    'Alam',
    4
  );

-- Note: The sample data uses a placeholder UUID for author_id
-- In production, you should use actual user IDs from your auth.users table
