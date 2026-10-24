ALTER TABLE blind_candidates
  ADD COLUMN is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN resume_file_name varchar(260),
  ADD COLUMN resume_file_path text,
  ADD COLUMN resume_file_mime varchar(120),
  ADD COLUMN resume_file_size bigint,
  ADD COLUMN resume_file_sha256 char(64);

ALTER TABLE blind_candidates
  ADD CONSTRAINT blind_candidate_resume_metadata_check CHECK (
    (resume_file_name IS NULL AND resume_file_path IS NULL AND resume_file_mime IS NULL
      AND resume_file_size IS NULL AND resume_file_sha256 IS NULL)
    OR
    (resume_file_name IS NOT NULL AND resume_file_path IS NOT NULL
      AND resume_file_mime = 'application/pdf' AND resume_file_size IS NOT NULL
      AND resume_file_size > 0 AND resume_file_sha256 IS NOT NULL)
  );

CREATE INDEX blind_candidates_demo_idx ON blind_candidates (is_demo, created_at DESC);
