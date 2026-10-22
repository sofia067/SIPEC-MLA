INSERT INTO users (username, display_name, role, password_hash, is_active)
VALUES
  ($1, $2, $3, $4, true),
  ($5, $6, $7, $8, true)
ON CONFLICT (lower(username)) DO UPDATE
SET display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash,
    is_active = true,
    updated_at = now();
