ALTER TABLE document_validations
  ADD COLUMN file_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN review_findings jsonb NOT NULL DEFAULT '[]'::jsonb;
