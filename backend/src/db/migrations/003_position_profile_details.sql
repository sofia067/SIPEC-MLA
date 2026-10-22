ALTER TABLE position_profiles
  ADD COLUMN level varchar(80) NOT NULL DEFAULT 'Profesional',
  ADD COLUMN principal_requirements text NOT NULL DEFAULT '',
  ADD COLUMN status varchar(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

CREATE INDEX position_profiles_status_department_idx
  ON position_profiles (status, department_id, title);
