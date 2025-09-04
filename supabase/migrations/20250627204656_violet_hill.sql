-- This migration fixes the syntax error in the previous migration
-- It properly updates NULL or empty values in the offpeak_windows table

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
    
    -- Update NULL values (separate statements to avoid syntax errors)
    UPDATE offpeak_windows SET start_time = '22:00' WHERE start_time IS NULL;
    UPDATE offpeak_windows SET end_time = '06:00' WHERE end_time IS NULL;
    
    -- Update empty strings (separate statements)
    UPDATE offpeak_windows SET start_time = '22:00' WHERE start_time = '';
    UPDATE offpeak_windows SET end_time = '06:00' WHERE end_time = '';
  END IF;
END $$;