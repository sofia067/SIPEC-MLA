ALTER TABLE blind_candidates
  ADD COLUMN resume_reviewed_at timestamptz,
  ADD COLUMN resume_reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL;
