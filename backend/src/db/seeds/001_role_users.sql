INSERT INTO users (username, display_name, role, area_name, password_hash, is_active)
VALUES
  ($1, $2, $3, $4, $5, true),
  ($6, $7, $8, $9, $10, true)
ON CONFLICT (lower(username)) DO UPDATE
SET display_name = EXCLUDED.display_name,
    area_name = COALESCE(NULLIF(users.area_name, ''), EXCLUDED.area_name),
    password_hash = CASE WHEN $11::boolean THEN EXCLUDED.password_hash ELSE users.password_hash END,
    updated_at = now()
WHERE users.role = EXCLUDED.role;
