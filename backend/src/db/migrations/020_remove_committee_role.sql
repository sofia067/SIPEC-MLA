DELETE FROM user_sessions
WHERE user_id IN (
  SELECT id FROM users WHERE role = 'committee'
);

UPDATE users
SET role = 'hr_specialist',
    is_active = false,
    updated_at = now()
WHERE role = 'committee';

ALTER TABLE users
  ALTER COLUMN role TYPE text USING role::text;

DROP TYPE user_role;

CREATE TYPE user_role AS ENUM ('admin', 'hr_specialist', 'area_manager');

ALTER TABLE users
  ALTER COLUMN role TYPE user_role USING role::user_role;
