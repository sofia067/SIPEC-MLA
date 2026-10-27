CREATE SEQUENCE public_application_code_seq START WITH 1;

CREATE TABLE public_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code varchar(32) NOT NULL UNIQUE,
  request_id uuid NOT NULL REFERENCES coverage_requests(id) ON DELETE RESTRICT,
  full_name varchar(160) NOT NULL,
  document_number varchar(24) NOT NULL,
  email varchar(254),
  phone varchar(40),
  resume_name varchar(255) NOT NULL,
  resume_content bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX public_applications_request_created_idx
  ON public_applications (request_id, created_at DESC);

CREATE UNIQUE INDEX public_applications_request_document_idx
  ON public_applications (request_id, document_number);
