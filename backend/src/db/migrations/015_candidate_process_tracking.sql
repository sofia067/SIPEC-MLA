ALTER TABLE blind_candidates
  ADD COLUMN process_stage varchar(32) NOT NULL DEFAULT 'application_received'
    CHECK (process_stage IN (
      'application_received',
      'document_review',
      'exam',
      'interview',
      'practical',
      'final_result'
    )),
  ADD COLUMN process_stage_updated_at timestamptz NOT NULL DEFAULT now();

UPDATE blind_candidates AS candidates
SET process_stage = CASE
  WHEN exams.objective_score < 100 OR exams.written_review_status = 'rejected' THEN 'final_result'
  WHEN exams.written_review_status = 'approved' THEN 'interview'
  WHEN exams.id IS NOT NULL THEN 'exam'
  ELSE 'application_received'
END,
process_stage_updated_at = coalesce(exams.reviewed_at, exams.submitted_at, candidates.created_at)
FROM (
  SELECT candidate_id, id, objective_score, written_review_status, reviewed_at, submitted_at
  FROM blind_candidate_exams
) AS exams
WHERE exams.candidate_id = candidates.id;

CREATE TABLE blind_candidate_process_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES blind_candidates(id) ON DELETE CASCADE,
  previous_stage varchar(32)
    CHECK (previous_stage IS NULL OR previous_stage IN (
      'application_received',
      'document_review',
      'exam',
      'interview',
      'practical',
      'final_result'
    )),
  process_stage varchar(32) NOT NULL
    CHECK (process_stage IN (
      'application_received',
      'document_review',
      'exam',
      'interview',
      'practical',
      'final_result'
    )),
  public_message varchar(500) NOT NULL DEFAULT '',
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO blind_candidate_process_history
  (candidate_id, process_stage, updated_by, created_at)
SELECT id, process_stage, created_by, process_stage_updated_at
FROM blind_candidates;

CREATE INDEX blind_candidate_process_history_candidate_idx
  ON blind_candidate_process_history (candidate_id, created_at);
