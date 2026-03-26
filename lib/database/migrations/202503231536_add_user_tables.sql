-- Add user profile and preference tables for anonymous mode and saved restaurants

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Device linking for users (allow multiple devices per user)
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Per-bar anonymous preference (whether to share name with restaurant)
CREATE TABLE IF NOT EXISTS user_bar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  share_name BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bar_id)
);

-- Saved restaurants for quick connections
CREATE TABLE IF NOT EXISTS saved_restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bar_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_user_bar_preferences_user_id ON user_bar_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bar_preferences_bar_id ON user_bar_preferences(bar_id);
CREATE INDEX IF NOT EXISTS idx_saved_restaurants_user_id ON saved_restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_restaurants_bar_id ON saved_restaurants(bar_id);

-- Enable Row Level Security (optional)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bar_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_restaurants ENABLE ROW LEVEL SECURITY;

-- Policies: users can only read/update their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own devices" ON user_devices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devices" ON user_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bar preferences" ON user_bar_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own bar preferences" ON user_bar_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bar preferences" ON user_bar_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view saved restaurants" ON saved_restaurants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert saved restaurants" ON saved_restaurants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete saved restaurants" ON saved_restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- Add user_id column to tabs (optional, for linking authenticated users to tabs)
-- ALTER TABLE tabs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
-- CREATE INDEX IF NOT EXISTS idx_tabs_user_id ON tabs(user_id);