ALTER TABLE blind_candidate_process_history
  ADD COLUMN interview_at timestamptz,
  ADD COLUMN interview_modality varchar(16)
    CHECK (interview_modality IS NULL OR interview_modality IN ('in_person', 'virtual')),
  ADD COLUMN interview_location varchar(500),
  ADD CONSTRAINT blind_candidate_interview_appointment_complete_check CHECK (
    (interview_at IS NULL AND interview_modality IS NULL AND interview_location IS NULL)
    OR
    (interview_at IS NOT NULL AND interview_modality IS NOT NULL AND interview_location IS NOT NULL)
  );
