-- Setup tables for badges and banners system

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT NOT NULL,
  badge_type VARCHAR(50) NOT NULL, -- 'free' or 'premium'
  requirement_type VARCHAR(50), -- 'creator', 'first_login', 'active_7days', 'active_30days', 'forum_posts', 'articles_read', etc.
  requirement_value INTEGER DEFAULT 0, -- threshold value for the requirement
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  banner_type VARCHAR(50) NOT NULL, -- 'free' or 'premium'
  requirement_type VARCHAR(50), -- similar to badges
  requirement_value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_badges junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, badge_id)
);

-- Create user_banners junction table
CREATE TABLE IF NOT EXISTS user_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banner_id UUID NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, banner_id)
);

-- Add active_badge_id and active_banner_id to users table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'active_badge_id'
  ) THEN
    ALTER TABLE users ADD COLUMN active_badge_id UUID REFERENCES badges(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'active_banner_id'
  ) THEN
    ALTER TABLE users ADD COLUMN active_banner_id UUID REFERENCES banners(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_banners_user_id ON user_banners(user_id);
CREATE INDEX IF NOT EXISTS idx_user_banners_banner_id ON user_banners(banner_id);
CREATE INDEX IF NOT EXISTS idx_badges_type ON badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_banners_type ON banners(banner_type);

-- Enable RLS (Row Level Security)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges (public can read all badges)
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

-- RLS Policies for banners (public can read all banners)
CREATE POLICY "Anyone can view banners"
  ON banners FOR SELECT
  USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' badges"
  ON user_badges FOR SELECT
  USING (true);

-- RLS Policies for user_banners
CREATE POLICY "Users can view their own banners"
  ON user_banners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' banners"
  ON user_banners FOR SELECT
  USING (true);

-- Insert sample badges (you can replace these URLs with your own)
INSERT INTO badges (name, description, icon_url, badge_type, requirement_type, requirement_value) VALUES
('The Grand Architect', 'Diberikan kepada pembuat atau pengembang utama TourJateng.', 'https://example.com/badges/grand-architect.png', 'premium', 'creator', 0),
('The First Wanderer', 'Diberikan kepada pengguna baru yang mulai menjelajahi destinasi.', 'https://example.com/badges/first-wanderer.png', 'free', 'first_login', 0),
('The Trail Seeker', 'Diberikan kepada pengguna yang telah aktif masuk selama 7 hari berturut-turut.', 'https://example.com/badges/trail-seeker.png', 'free', 'active_7days', 7),
('The Seasoned Voyager', 'Diberikan kepada pengguna yang telah aktif masuk selama 30 hari berturut-turut.', 'https://example.com/badges/seasoned-voyager.png', 'free', 'active_30days', 30),
('The Innovator', 'Diberikan kepada pengguna yang telah membuat 10 postingan forum.', 'https://example.com/badges/innovator.png', 'premium', 'forum_posts', 10),
('The Forum Sage', 'Diberikan kepada pengguna yang telah membuat 50 postingan forum.', 'https://example.com/badges/forum-sage.png', 'premium', 'forum_posts', 50);

-- Insert sample banners (you can replace these URLs with your own)
INSERT INTO banners (name, description, image_url, banner_type, requirement_type, requirement_value) VALUES
('Borobudur Sunrise', 'Banner eksklusif dengan pemandangan sunrise di Borobudur', 'https://example.com/banners/borobudur-sunrise.jpg', 'premium', 'active_30days', 30),
('Dieng Plateau', 'Banner dengan pemandangan Dataran Tinggi Dieng', 'https://example.com/banners/dieng-plateau.jpg', 'free', 'first_login', 0),
('Karimunjawa Beach', 'Banner dengan pemandangan pantai Karimunjawa', 'https://example.com/banners/karimunjawa.jpg', 'free', 'active_7days', 7),
('Prambanan Temple', 'Banner dengan candi Prambanan yang megah', 'https://example.com/banners/prambanan.jpg', 'premium', 'forum_posts', 20);

-- Function to automatically award first login badge
CREATE OR REPLACE FUNCTION award_first_login_badge()
RETURNS TRIGGER AS $$
DECLARE
  first_badge_id UUID;
BEGIN
  -- Get the "The First Wanderer" badge ID
  SELECT id INTO first_badge_id
  FROM badges
  WHERE requirement_type = 'first_login'
  LIMIT 1;

  -- Award the badge if it exists
  IF first_badge_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (NEW.id, first_badge_id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to award first login badge on user creation
DROP TRIGGER IF EXISTS trigger_award_first_login_badge ON users;
CREATE TRIGGER trigger_award_first_login_badge
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION award_first_login_badge();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_badges_updated_at ON badges;
CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
