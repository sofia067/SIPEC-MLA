ALTER TABLE coverage_requests
  ADD COLUMN application_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD CONSTRAINT coverage_request_application_documents_array_check
    CHECK (jsonb_typeof(application_documents) = 'array');
