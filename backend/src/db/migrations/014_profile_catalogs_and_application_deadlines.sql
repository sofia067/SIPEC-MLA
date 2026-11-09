UPDATE application_settings
SET catalog_data = catalog_data || jsonb_build_object(
  'positionLevels', jsonb_build_array('Directivo', 'Profesional', 'Técnico', 'Auxiliar'),
  'educationLevels', jsonb_build_array(
    'Secundaria completa',
    'Técnica básica',
    'Técnica superior',
    'Bachiller universitario',
    'Título profesional',
    'Posgrado'
  )
)
WHERE id = 1;

ALTER TABLE coverage_requests
  ADD COLUMN application_deadline_original date,
  ADD COLUMN application_deadline date;

CREATE TABLE coverage_request_deadline_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES coverage_requests(id) ON DELETE CASCADE,
  previous_deadline date NOT NULL,
  extended_deadline date NOT NULL,
  extended_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (extended_deadline > previous_deadline)
);

CREATE INDEX coverage_request_deadline_extensions_request_idx
  ON coverage_request_deadline_extensions (request_id, created_at);
