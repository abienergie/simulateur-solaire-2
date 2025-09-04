-- This migration fixes the offpeak_windows table by ensuring all columns have proper NOT NULL constraints
-- and providing default values where appropriate

-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'offpeak_windows') THEN
    -- Add default values to columns
    ALTER TABLE offpeak_windows 
      ALTER COLUMN start_time SET DEFAULT '22:00',
      ALTER COLUMN end_time SET DEFAULT '06:00';
    
    -- Update any existing NULL values
    UPDATE offpeak_windows SET 
      start_time = '22:00' WHERE start_time IS NULL,
      end_time = '06:00' WHERE end_time IS NULL;
      
    -- Add NOT NULL constraints if they don't exist
    DO $$
    BEGIN
      -- Check if start_time already has NOT NULL constraint
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'offpeak_windows' 
        AND column_name = 'start_time' 
        AND is_nullable = 'YES'
      ) THEN
        ALTER TABLE offpeak_windows ALTER COLUMN start_time SET NOT NULL;
      END IF;
      
      -- Check if end_time already has NOT NULL constraint
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'offpeak_windows' 
        AND column_name = 'end_time' 
        AND is_nullable = 'YES'
      ) THEN
        ALTER TABLE offpeak_windows ALTER COLUMN end_time SET NOT NULL;
      END IF;
    END $$;
  END IF;
END $$;