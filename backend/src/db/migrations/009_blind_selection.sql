CREATE SEQUENCE blind_candidate_code_seq START WITH 1;

CREATE TABLE blind_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code varchar(24) NOT NULL UNIQUE,
  request_id uuid NOT NULL REFERENCES coverage_requests(id) ON DELETE RESTRICT,
  full_name varchar(160) NOT NULL,
  document_number varchar(24) NOT NULL,
  email varchar(254),
  phone varchar(40),
  identity_revealed_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, document_number)
);

CREATE TABLE blind_candidate_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE REFERENCES blind_candidates(id) ON DELETE CASCADE,
  objective_answers jsonb NOT NULL,
  written_answers jsonb NOT NULL,
  objective_score smallint NOT NULL CHECK (objective_score BETWEEN 0 AND 100),
  written_review_status varchar(16) NOT NULL DEFAULT 'pending'
    CHECK (written_review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blind_candidates_request_idx ON blind_candidates (request_id, created_at DESC);
CREATE INDEX blind_candidate_exams_review_idx ON blind_candidate_exams (written_review_status, submitted_at DESC);
