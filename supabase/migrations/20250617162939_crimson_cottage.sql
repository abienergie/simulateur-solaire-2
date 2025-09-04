/*
  # Create Enedis tokens table

  1. New Tables
    - `enedis_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prm` (text, not null)
      - `access_token` (text, not null)
      - `refresh_token` (text)
      - `expires_at` (timestamptz, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `enedis_tokens` table
    - Add policy for users to read their own tokens
    - Add policy for users to insert their own tokens
    - Add policy for users to update their own tokens
*/

CREATE TABLE IF NOT EXISTS enedis_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prm text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, prm)
);

-- Enable RLS
ALTER TABLE enedis_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for reading tokens
CREATE POLICY "Users can read their own tokens" 
  ON enedis_tokens
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for inserting tokens
CREATE POLICY "Users can insert their own tokens"
  ON enedis_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for updating tokens
CREATE POLICY "Users can update their own tokens"
  ON enedis_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);