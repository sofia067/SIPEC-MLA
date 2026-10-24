CREATE TABLE application_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  anonymization_enabled boolean NOT NULL DEFAULT true,
  ocr_confidence_threshold smallint NOT NULL DEFAULT 85
    CHECK (ocr_confidence_threshold BETWEEN 0 AND 100),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO application_settings (id) VALUES (1);
