-- This migration fixes the syntax errors in previous migrations
-- It properly updates NULL or empty values in the offpeak_windows table
-- by using separate UPDATE statements for each condition

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
    
    -- Update NULL values with separate statements
    UPDATE offpeak_windows SET start_time = '22:00' WHERE start_time IS NULL;
    UPDATE offpeak_windows SET end_time = '06:00' WHERE end_time IS NULL;
    
    -- Update empty strings with separate statements
    UPDATE offpeak_windows SET start_time = '22:00' WHERE start_time = '';
    UPDATE offpeak_windows SET end_time = '06:00' WHERE end_time = '';
    
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