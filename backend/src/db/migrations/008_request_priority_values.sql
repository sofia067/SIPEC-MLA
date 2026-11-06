ALTER TABLE coverage_requests
  DROP CONSTRAINT IF EXISTS coverage_requests_priority_check;

UPDATE coverage_requests
SET priority = 'medium'
WHERE priority::text NOT IN ('low', 'medium', 'high');

ALTER TABLE coverage_requests
  ADD CONSTRAINT coverage_requests_priority_check
  CHECK (priority::text IN ('low', 'medium', 'high'));
