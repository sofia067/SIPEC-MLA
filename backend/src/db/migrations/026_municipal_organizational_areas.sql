WITH official_areas(name, sort_order) AS (
  SELECT area.name, 1000 + area.ordinality
  FROM unnest(ARRAY[
    'Consejo Municipal',
    'Alcaldía',
    'Gerencia Municipal',
    'Órgano de Control Institucional',
    'Procuraduría Pública Municipal',
    'Secretaría General',
    'Unidad de Tecnología de la Información',
    'Oficina de Gestión de Recursos Humanos',
    'Oficina de Administración y Finanzas',
    'Oficina de Asesoría Jurídica',
    'Oficina de Planificación, Presupuesto',
    'Gerencia de Servicios de Administración Tributaria',
    'Gerencia de Desarrollo Territorial e Infraestructura',
    'Gerencia de Desarrollo Económico',
    'Subgerencia de Participación Vecinal y Seguridad Ciudadana',
    'Subgerencia de Gestión Ambiental',
    'Concejo de Coordinación Local Distrital',
    'Junta de Delegados Vecinales y Comunales',
    'Plataforma Distrital de Defensa Civil',
    'Comité Distrital de Seguridad Ciudadana',
    'Comité Municipal por los Derechos del Niño y Adolescente – DEMUNA',
    'Comité de Administración del Programa del Vaso de Leche',
    'Comisión Ambiental Municipal'
  ]::text[]) WITH ORDINALITY AS area(name, ordinality)
),
existing_areas(name, sort_order) AS (
  SELECT area.name, area.ordinality
  FROM application_settings settings
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE
      WHEN jsonb_typeof(settings.catalog_data->'organizationalAreas') = 'array'
        THEN settings.catalog_data->'organizationalAreas'
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS area(name, ordinality)
  WHERE settings.id = 1
),
all_areas AS (
  SELECT name, sort_order FROM existing_areas
  UNION ALL
  SELECT name, sort_order FROM official_areas
),
unique_areas AS (
  SELECT DISTINCT ON (lower(name)) name, sort_order
  FROM all_areas
  ORDER BY lower(name), sort_order
)
UPDATE application_settings settings
SET catalog_data = jsonb_set(
  COALESCE(settings.catalog_data, '{}'::jsonb),
  '{organizationalAreas}',
  COALESCE((SELECT jsonb_agg(name ORDER BY sort_order) FROM unique_areas), '[]'::jsonb),
  true
)
WHERE settings.id = 1;
