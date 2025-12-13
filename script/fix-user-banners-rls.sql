-- Fix RLS policy for user_banners and user_badges to allow users to insert their own

-- ===== USER_BANNERS =====
-- Drop ALL existing policies for user_banners
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_banners') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_banners', r.policyname);
    END LOOP;
END $$;

-- Create new policies that allow insert
CREATE POLICY "Users can view all user banners"
  ON user_banners FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own banners"
  ON user_banners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banners"
  ON user_banners FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banners"
  ON user_banners FOR DELETE
  USING (auth.uid() = user_id);

-- ===== USER_BADGES =====
-- Drop ALL existing policies for user_badges
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_badges') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_badges', r.policyname);
    END LOOP;
END $$;

-- Create new policies that allow insert
CREATE POLICY "Users can view all user badges"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges"
  ON user_badges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badges"
  ON user_badges FOR DELETE
  USING (auth.uid() = user_id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('user_banners', 'user_badges')
ORDER BY tablename, policyname;
