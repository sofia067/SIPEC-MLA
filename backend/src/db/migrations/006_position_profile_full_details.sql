ALTER TABLE position_profiles
  ADD COLUMN profile_code varchar(40),
  ADD COLUMN remuneration numeric(12, 2),
  ADD COLUMN education text NOT NULL DEFAULT '',
  ADD COLUMN general_experience text NOT NULL DEFAULT '',
  ADD COLUMN specific_experience text NOT NULL DEFAULT '',
  ADD COLUMN technical_knowledge text NOT NULL DEFAULT '',
  ADD COLUMN functions jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX position_profiles_profile_code_unique_idx
  ON position_profiles (profile_code)
  WHERE profile_code IS NOT NULL;
