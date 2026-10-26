CREATE TABLE system_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  organization_name varchar(200) NOT NULL DEFAULT 'Municipalidad Distrital de Los Aquijes',
  fiscal_year integer NOT NULL DEFAULT 2026 CHECK (fiscal_year BETWEEN 2000 AND 2100),
  support_email varchar(254) NOT NULL DEFAULT '',
  max_upload_mb integer NOT NULL DEFAULT 10 CHECK (max_upload_mb BETWEEN 1 AND 50),
  passing_score integer NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  declaration_deadline_days integer NOT NULL DEFAULT 5 CHECK (declaration_deadline_days BETWEEN 1 AND 90),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO system_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
