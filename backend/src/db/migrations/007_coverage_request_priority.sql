ALTER TABLE coverage_requests
  ADD COLUMN IF NOT EXISTS priority varchar(16) NOT NULL DEFAULT 'Media'
    CHECK (priority IN ('Alta', 'Media', 'Baja'));
