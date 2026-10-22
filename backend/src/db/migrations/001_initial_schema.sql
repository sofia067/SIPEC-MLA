CREATE TYPE user_role AS ENUM ('admin', 'hr_specialist', 'area_manager');
CREATE TYPE request_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'completed');
CREATE TYPE work_item_status AS ENUM ('pending', 'completed');
CREATE SEQUENCE coverage_request_code_seq START WITH 1;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(80) NOT NULL,
  display_name varchar(160) NOT NULL,
  role user_role NOT NULL,
  password_hash text NOT NULL,
  area_name varchar(160),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));

CREATE TABLE user_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_sessions_expiry_idx ON user_sessions (expires_at);

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE position_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  title varchar(160) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, title)
);

CREATE TABLE coverage_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(24) NOT NULL UNIQUE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  position_id uuid NOT NULL REFERENCES position_profiles(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  required_by date,
  status request_status NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX coverage_requests_status_created_idx ON coverage_requests (status, created_at DESC);
CREATE INDEX coverage_requests_required_by_idx ON coverage_requests (required_by)
  WHERE status IN ('pending', 'in_review');

CREATE TABLE document_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES coverage_requests(id) ON DELETE CASCADE,
  document_type varchar(120) NOT NULL,
  status work_item_status NOT NULL DEFAULT 'pending',
  validated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE technical_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES coverage_requests(id) ON DELETE CASCADE,
  candidate_name varchar(160),
  status work_item_status NOT NULL DEFAULT 'pending',
  score numeric(5, 2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  evaluated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES coverage_requests(id) ON DELETE RESTRICT,
  employee_name varchar(160) NOT NULL,
  starts_on date NOT NULL,
  assigned_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type varchar(120) NOT NULL,
  resource_type varchar(120) NOT NULL,
  resource_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_resource_idx ON audit_events (resource_type, resource_id, created_at DESC);
