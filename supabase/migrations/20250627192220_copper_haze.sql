-- Create the offpeak_windows table if it doesn't exist
CREATE TABLE IF NOT EXISTS offpeak_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text UNIQUE NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
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