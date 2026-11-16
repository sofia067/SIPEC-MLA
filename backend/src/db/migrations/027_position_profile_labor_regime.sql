ALTER TABLE position_profiles
  ADD COLUMN IF NOT EXISTS labor_regime varchar(40);
