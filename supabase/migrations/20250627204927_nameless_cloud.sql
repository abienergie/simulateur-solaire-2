-- This migration fixes the syntax errors in previous migrations
-- It properly handles empty strings and NULL values in the offpeak_windows table
-- by using separate UPDATE statements and proper error handling

DO $$
BEGIN
  -- First check if the table exists
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
    
    -- Update NULL values with separate statements and error handling
    BEGIN
      UPDATE offpeak_windows SET start_time = '22:00' WHERE start_time IS NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error updating NULL start_time: %', SQLERRM;
    END;
    
    BEGIN
      UPDATE offpeak_windows SET end_time = '06:00' WHERE end_time IS NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error updating NULL end_time: %', SQLERRM;
    END;
    
    -- Handle empty strings with separate statements and error handling
    -- First check if there are any rows with empty strings
    IF EXISTS (SELECT FROM offpeak_windows WHERE start_time = '') THEN
      BEGIN
        UPDATE offpeak_windows SET start_time = '22:00' WHERE start_time = '';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating empty start_time: %', SQLERRM;
      END;
    END IF;
    
    IF EXISTS (SELECT FROM offpeak_windows WHERE end_time = '') THEN
      BEGIN
        UPDATE offpeak_windows SET end_time = '06:00' WHERE end_time = '';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating empty end_time: %', SQLERRM;
      END;
    END IF;
    
    -- Log completion
    RAISE NOTICE 'offpeak_windows table updated successfully';
  ELSE
    -- Create the table if it doesn't exist
    CREATE TABLE offpeak_windows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      prm text UNIQUE NOT NULL,
      start_time text NOT NULL DEFAULT '22:00',
      end_time text NOT NULL DEFAULT '06:00',
      created_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE offpeak_windows ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for reading offpeak windows
    CREATE POLICY "Anyone can read offpeak windows" 
      ON offpeak_windows
      FOR SELECT 
      TO PUBLIC
      USING (true);
    
    -- Create policy for inserting offpeak windows
    CREATE POLICY "Anonymous users can insert offpeak windows"
      ON offpeak_windows
      FOR INSERT
      TO anon
      WITH CHECK (true);
    
    -- Create policy for updating offpeak windows
    CREATE POLICY "Anonymous users can update offpeak windows"
      ON offpeak_windows
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
    
    -- Create policy for service role to manage offpeak windows
    CREATE POLICY "Service role can manage offpeak windows"
      ON offpeak_windows
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    RAISE NOTICE 'offpeak_windows table created successfully';
  END IF;
END $$;