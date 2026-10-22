CREATE TYPE worker_status AS ENUM ('active', 'inactive');

CREATE TABLE workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number varchar(32) NOT NULL,
  document_number varchar(24) NOT NULL,
  full_name varchar(160) NOT NULL,
  email varchar(254),
  phone varchar(40),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  position_id uuid REFERENCES position_profiles(id) ON DELETE SET NULL,
  status worker_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_number),
  UNIQUE (document_number)
);

CREATE INDEX workers_department_status_idx ON workers (department_id, status, full_name);

CREATE TABLE position_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES position_profiles(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (position_id, name)
);

ALTER TABLE position_profiles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE document_validations
  ALTER COLUMN request_id DROP NOT NULL,
  ADD COLUMN worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  ADD COLUMN description text NOT NULL DEFAULT '',
  ADD CONSTRAINT document_validation_owner_check
    CHECK (request_id IS NOT NULL OR worker_id IS NOT NULL);

CREATE INDEX document_validations_worker_idx ON document_validations (worker_id, status);

ALTER TABLE technical_evaluations
  ALTER COLUMN request_id DROP NOT NULL,
  ADD COLUMN worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  ADD COLUMN evaluation_name varchar(160) NOT NULL DEFAULT 'Evaluación técnica',
  ADD COLUMN notes text NOT NULL DEFAULT '',
  ADD CONSTRAINT technical_evaluation_owner_check
    CHECK (request_id IS NOT NULL OR worker_id IS NOT NULL);

CREATE INDEX technical_evaluations_worker_idx ON technical_evaluations (worker_id, status);

CREATE INDEX coverage_requests_position_idx ON coverage_requests (position_id, created_at DESC);
CREATE INDEX audit_events_created_idx ON audit_events (created_at DESC);
