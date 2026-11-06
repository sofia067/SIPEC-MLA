ALTER TABLE coverage_requests
  ALTER COLUMN code TYPE varchar(64);

CREATE TABLE department_request_code_counters (
  department_id uuid PRIMARY KEY REFERENCES departments(id) ON DELETE CASCADE,
  prefix varchar(8) NOT NULL UNIQUE,
  next_number bigint NOT NULL DEFAULT 1 CHECK (next_number > 0)
);

CREATE FUNCTION make_department_request_prefix(department_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized_name text;
  tokens text[];
  prefix_value text;
BEGIN
  normalized_name := upper(translate(department_name, 'ÁÉÍÓÚÜÑ', 'AEIOUUN'));
  normalized_name := regexp_replace(normalized_name, '[^A-Z0-9 ]', ' ', 'g');

  SELECT array_agg(token ORDER BY ordinal)
  INTO tokens
  FROM regexp_split_to_table(normalized_name, '\s+') WITH ORDINALITY AS words(token, ordinal)
  WHERE token <> ''
    AND token <> ALL (ARRAY[
      'SUBGERENCIA', 'GERENCIA', 'OFICINA', 'UNIDAD',
      'DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL', 'Y', 'E', 'AL'
    ]);

  IF coalesce(cardinality(tokens), 0) = 0 THEN
    RETURN 'AREA';
  END IF;

  IF cardinality(tokens) = 1 THEN
    prefix_value := left(tokens[1], 3);
  ELSIF cardinality(tokens) = 2 THEN
    prefix_value := left(tokens[1], 1) || left(tokens[2], 1);
  ELSE
    SELECT left(tokens[1], 3) || string_agg(left(token, 1), '' ORDER BY ordinal)
    INTO prefix_value
    FROM unnest(tokens[2:cardinality(tokens)]) WITH ORDINALITY AS words(token, ordinal);
  END IF;

  RETURN left(prefix_value, 8);
END;
$$;

DO $$
DECLARE
  department_row record;
  base_prefix text;
  prefix_value text;
  suffix_number integer;
BEGIN
  FOR department_row IN
    SELECT id, name FROM departments ORDER BY name, id
  LOOP
    base_prefix := make_department_request_prefix(department_row.name);
    prefix_value := base_prefix;
    suffix_number := 1;

    WHILE EXISTS (
      SELECT 1 FROM department_request_code_counters WHERE prefix = prefix_value
    ) LOOP
      prefix_value := left(base_prefix, 6) || suffix_number::text;
      suffix_number := suffix_number + 1;
    END LOOP;

    INSERT INTO department_request_code_counters (department_id, prefix)
    VALUES (department_row.id, prefix_value);
  END LOOP;
END;
$$;

CREATE FUNCTION assign_department_request_prefix()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_prefix text;
  prefix_value text;
  suffix_number integer := 1;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('sipec.department_request_code_prefix'));
  base_prefix := make_department_request_prefix(NEW.name);
  prefix_value := base_prefix;

  WHILE EXISTS (
    SELECT 1 FROM department_request_code_counters WHERE prefix = prefix_value
  ) LOOP
    prefix_value := left(base_prefix, 6) || suffix_number::text;
    suffix_number := suffix_number + 1;
  END LOOP;

  INSERT INTO department_request_code_counters (department_id, prefix)
  VALUES (NEW.id, prefix_value);
  RETURN NEW;
END;
$$;

CREATE TRIGGER departments_request_code_prefix_insert
AFTER INSERT ON departments
FOR EACH ROW
EXECUTE FUNCTION assign_department_request_prefix();

CREATE TEMPORARY TABLE request_code_migration_map (
  request_id uuid PRIMARY KEY,
  old_code varchar(64) NOT NULL,
  new_code varchar(64) NOT NULL
) ON COMMIT DROP;

INSERT INTO request_code_migration_map (request_id, old_code, new_code)
SELECT numbered.id,
       numbered.code,
       'SC-' || counters.prefix || '-' || lpad(numbered.area_number::text, 5, '0')
FROM (
  SELECT id, code, department_id,
         row_number() OVER (PARTITION BY department_id ORDER BY created_at, id) AS area_number
  FROM coverage_requests
) AS numbered
JOIN department_request_code_counters AS counters
  ON counters.department_id = numbered.department_id;

UPDATE coverage_requests
SET code = 'TMP-' || replace(id::text, '-', '');

UPDATE coverage_requests AS requests
SET code = mapping.new_code
FROM request_code_migration_map AS mapping
WHERE requests.id = mapping.request_id;

UPDATE department_request_code_counters AS counters
SET next_number = counts.request_count + 1
FROM (
  SELECT department_id, count(*)::bigint AS request_count
  FROM coverage_requests
  GROUP BY department_id
) AS counts
WHERE counters.department_id = counts.department_id;

UPDATE audit_events AS events
SET metadata = jsonb_set(
  jsonb_set(events.metadata, '{code}', to_jsonb(mapping.new_code), false),
  '{requestCode}',
  to_jsonb(mapping.new_code),
  false
)
FROM request_code_migration_map AS mapping
WHERE events.resource_id = mapping.request_id
  AND events.resource_type = 'coverage_request';

UPDATE audit_events AS events
SET metadata = jsonb_set(events.metadata, '{requestCode}', to_jsonb(mapping.new_code), false)
FROM request_code_migration_map AS mapping
WHERE events.metadata->>'requestCode' = mapping.old_code;

UPDATE notifications AS notices
SET message = replace(notices.message, mapping.old_code, mapping.new_code)
FROM request_code_migration_map AS mapping
WHERE notices.message LIKE '%' || mapping.old_code || '%';

ALTER TABLE coverage_requests
  ALTER COLUMN code TYPE varchar(24);
