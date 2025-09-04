-- This migration ensures that the offpeak_windows table has proper default values
-- and NOT NULL constraints for start_time and end_time columns

-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'offpeak_windows') THEN
    -- Add default values to columns if they don't already have them
    BEGIN
      ALTER TABLE offpeak_windows 
        ALTER COLUMN start_time SET DEFAULT '22:00',
        ALTER COLUMN end_time SET DEFAULT '06:00';
    EXCEPTION WHEN OTHERS THEN
      -- Column might already have a default value, ignore the error
      RAISE NOTICE 'Default values already set or error occurred: %', SQLERRM;
    END;
    
    -- Update any existing NULL values
    UPDATE offpeak_windows SET 
      start_time = '22:00' WHERE start_time IS NULL OR start_time = '',
      end_time = '06:00' WHERE end_time IS NULL OR end_time = '';
      
    -- Add NOT NULL constraints if they don't exist
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
    EXCEPTION WHEN OTHERS THEN
      -- Constraints might already exist, ignore the error
      RAISE NOTICE 'NOT NULL constraints already set or error occurred: %', SQLERRM;
    END;
  END IF;
END $$;