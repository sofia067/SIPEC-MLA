ALTER TABLE blind_candidates
  ADD COLUMN match_score smallint CHECK (match_score BETWEEN 0 AND 100),
  ADD COLUMN match_status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (match_status IN ('pending', 'calculated', 'insufficient_data', 'extraction_failed')),
  ADD COLUMN match_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN match_calculated_at timestamptz;

ALTER TABLE blind_candidates
  ADD CONSTRAINT blind_candidate_match_result_check CHECK (
    (match_status = 'calculated' AND match_score IS NOT NULL AND match_calculated_at IS NOT NULL)
    OR
    (match_status <> 'calculated' AND match_score IS NULL)
  );
