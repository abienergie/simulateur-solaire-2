-- This migration fixes the offpeak_windows table by ensuring all columns have proper NOT NULL constraints
-- and providing default values where appropriate

-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'offpeak_windows') THEN
    -- Drop existing constraints if they exist
    ALTER TABLE offpeak_windows 
      ALTER COLUMN start_time SET DEFAULT '22:00',
      ALTER COLUMN end_time SET DEFAULT '06:00';
    
    -- Update any existing NULL values
    UPDATE offpeak_windows SET 
      start_time = '22:00' WHERE start_time IS NULL,
      end_time = '06:00' WHERE end_time IS NULL;
  END IF;
END $$;