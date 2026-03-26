-- Add user_id column to customers table for auth-based customer identification
-- This migration adds user_id to link customers directly to auth.users

-- Step 1: Add user_id column (nullable first, then make NOT NULL if table is empty)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Step 3: Add comment on column
COMMENT ON COLUMN customers.user_id IS 'Direct reference to auth.users.id for authenticated customer identification';

-- Step 4: Add unique constraint (check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'customers' 
        AND constraint_name = 'customers_user_id_unique'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT customers_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Step 5: Make column NOT NULL if table is empty (safe for clean slate)
DO $$
BEGIN
    -- Check if table is empty before making column NOT NULL
    IF (SELECT COUNT(*) FROM customers) = 0 THEN
        ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;
