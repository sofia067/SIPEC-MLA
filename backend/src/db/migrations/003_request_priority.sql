DO $$
BEGIN
  CREATE TYPE request_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE coverage_requests
  ADD COLUMN IF NOT EXISTS priority request_priority NOT NULL DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS coverage_requests_priority_created_idx
  ON coverage_requests (priority, created_at DESC);
