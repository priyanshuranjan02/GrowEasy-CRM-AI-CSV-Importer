/*
# Create import_jobs table for CSV processing state

This table persists AI import job state across Supabase Edge Function invocations,
since Edge Functions are stateless and cannot share in-memory state.

1. New Tables
   - `import_jobs`
     - `id` (uuid, primary key) — the job identifier returned to the client
     - `status` (text) — pending | processing | completed | failed
     - `file_name` (text) — original CSV file name
     - `total_rows` (int) — total rows in the CSV
     - `total_batches` (int) — number of AI batches
     - `completed_batches` (int) — batches finished so far
     - `processed_records` (int) — successfully extracted records
     - `skipped_count` (int) — rows skipped (no email/mobile)
     - `results` (jsonb) — array of CRM records (populated on completion)
     - `headers` (jsonb) — CSV column headers
     - `rows` (jsonb) — raw CSV rows for batch processing
     - `error_message` (text) — error details if failed
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

2. Security
   - Enable RLS on `import_jobs`
   - Allow anon + authenticated CRUD (no user accounts in this app)

3. Notes
   - results is JSONB array to store CRM records efficiently
   - rows stored temporarily during processing, could be cleared post-completion
*/

CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  file_name text NOT NULL DEFAULT '',
  total_rows integer NOT NULL DEFAULT 0,
  total_batches integer NOT NULL DEFAULT 0,
  completed_batches integer NOT NULL DEFAULT 0,
  processed_records integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  headers jsonb NOT NULL DEFAULT '[]'::jsonb,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_import_jobs" ON import_jobs;
CREATE POLICY "anon_select_import_jobs" ON import_jobs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_import_jobs" ON import_jobs;
CREATE POLICY "anon_insert_import_jobs" ON import_jobs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_import_jobs" ON import_jobs;
CREATE POLICY "anon_update_import_jobs" ON import_jobs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_import_jobs" ON import_jobs;
CREATE POLICY "anon_delete_import_jobs" ON import_jobs FOR DELETE
  TO anon, authenticated USING (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_import_jobs_updated_at ON import_jobs;
CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
