ALTER TABLE workers
  ADD COLUMN is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN appointment_resolution varchar(120),
  ADD COLUMN appointment_date date;

ALTER TABLE workers
  ADD CONSTRAINT worker_appointment_details_check CHECK (
    (appointment_resolution IS NULL AND appointment_date IS NULL)
    OR
    (appointment_resolution IS NOT NULL AND appointment_date IS NOT NULL)
  );

CREATE INDEX workers_demo_idx ON workers (is_demo, full_name);
