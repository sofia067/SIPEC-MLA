ALTER TABLE assignments
  ADD COLUMN worker_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  ADD COLUMN notes text NOT NULL DEFAULT '',
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX assignments_worker_idx ON assignments (worker_id);

ALTER TABLE document_validations
  ADD COLUMN file_name varchar(260),
  ADD COLUMN file_path text,
  ADD COLUMN file_mime varchar(120),
  ADD COLUMN file_size bigint,
  ADD COLUMN ocr_status varchar(16) NOT NULL DEFAULT 'none'
    CHECK (ocr_status IN ('none', 'processing', 'completed', 'failed', 'no_text')),
  ADD COLUMN ocr_text text,
  ADD COLUMN ocr_message text,
  ADD COLUMN ocr_processed_at timestamptz;

CREATE INDEX document_validations_ocr_idx ON document_validations (ocr_status);
