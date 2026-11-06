ALTER TABLE application_settings
  ADD COLUMN institutional_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN catalog_data jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE application_settings
SET institutional_data = jsonb_build_object(
      'rof', '',
      'logoUrl', '/AquijesLogo.jpg',
      'acronym', 'SIPEC-MLA',
      'address', '',
      'fiscalYear', extract(year FROM current_date)::int
    ),
    catalog_data = jsonb_build_object(
      'roadTypes', jsonb_build_array('Avenida', 'Calle', 'Jirón', 'Pasaje'),
      'laborRegimes', jsonb_build_array('CAS'),
      'contractTypes', jsonb_build_array('CAS', 'Plazo fijo', 'Plazo indeterminado', 'Suplencia'),
      'organizationalAreas', jsonb_build_array()
    )
WHERE id = 1;
