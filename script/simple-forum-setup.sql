-- Simple Forum Setup for Testing
-- Run this in your Supabase SQL Editor

-- Create forum_posts table (simplified version)
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  author_id UUID,
  category TEXT DEFAULT 'Alam',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  comments_count INTEGER DEFAULT 0
);

-- Create forum_comments table (simplified version)  
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - allow all operations for now (you can tighten later)
CREATE POLICY "Enable all operations for forum_posts" ON public.forum_posts
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for forum_comments" ON public.forum_comments  
FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data for testing
INSERT INTO public.forum_posts (title, content, author, category, comments_count) VALUES
(
  'Pertama Kali ke Semarang, Ada Rekomendasi Tempat Wajib?',
  'Halo semua! Minggu depak aku mau jalan-jalan ke Semarang untuk pertama kalinya. Selain Lawang Sewu dan Kota Lama, ada spot unik lain yang harus dikunjungi?',
  'Sarah Lee',
  'Alam',
  1
),
(
  'Pengalaman Sunrise di Candi Gedong Songo', 
  'Baru pulang dari Bandungan dan mampir ke Candi Gedong Songo. Gila sih view sunrise-nya kerennn banget! Ada yang punya rekomendasi spot lain di sekitar sana?',
  'Sarah Lee',
  'Alam', 
  2
),
(
  'Cari Spot Hidden Gem di Kendal!',
  'Aku akhir-akhir ini lagi suka banget eksplor tempat-tempat wisata yang belum terlalu ramai dan masih alami. Rasanya seru aja kalau bisa nemuin destinasi yang masih tersembunyi.',
  'Sarah Lee',
  'Alam',
  4
);