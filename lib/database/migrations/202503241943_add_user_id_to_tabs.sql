-- Add user_id column to tabs for linking authenticated users to their tabs
-- This migration backfills user_id from user_devices where device_identifier matches

-- Step 1: Add user_id column (nullable, references auth.users)
ALTER TABLE tabs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tabs_user_id ON tabs(user_id);

-- Step 3: Backfill existing tabs with user_id from user_devices
-- For each tab where device_identifier matches a device_id in user_devices, set user_id
UPDATE tabs t
SET user_id = ud.user_id
FROM user_devices ud
WHERE t.device_identifier = ud.device_id
  AND t.user_id IS NULL;

-- Step 4: Add comment on column
COMMENT ON COLUMN tabs.user_id IS 'References auth.users.id; links authenticated user to tab (nullable for anonymous tabs)';