ALTER TABLE position_profiles
  ADD COLUMN IF NOT EXISTS profile_code varchar(32),
  ADD COLUMN IF NOT EXISTS reference_salary numeric(10, 2),
  ADD COLUMN IF NOT EXISTS academic_formation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS general_experience text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS specific_experience text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS technical_knowledge text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS responsibilities text[] NOT NULL DEFAULT '{}';
