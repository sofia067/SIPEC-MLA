ALTER TABLE document_validations
  ADD COLUMN candidate_id uuid REFERENCES blind_candidates(id) ON DELETE CASCADE;

ALTER TABLE document_validations
  DROP CONSTRAINT document_validation_owner_check,
  ADD CONSTRAINT document_validation_owner_check
    CHECK (
      (candidate_id IS NOT NULL AND request_id IS NULL AND worker_id IS NULL)
      OR
      (candidate_id IS NULL AND (request_id IS NOT NULL OR worker_id IS NOT NULL))
    );

CREATE INDEX document_validations_candidate_idx
  ON document_validations (candidate_id, status);
