ALTER TABLE position_profiles
  ADD COLUMN IF NOT EXISTS profile_code varchar(40),
  ADD COLUMN IF NOT EXISTS remuneration numeric(12, 2),
  ADD COLUMN IF NOT EXISTS education text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS general_experience text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS specific_experience text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS technical_knowledge text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS functions jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS position_profiles_profile_code_unique_idx
  ON position_profiles (profile_code)
  WHERE profile_code IS NOT NULL;
