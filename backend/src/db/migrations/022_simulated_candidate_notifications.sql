CREATE TABLE blind_candidate_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES blind_candidates(id) ON DELETE CASCADE,
  channel varchar(24) NOT NULL DEFAULT 'whatsapp'
    CHECK (channel = 'whatsapp'),
  message varchar(1000) NOT NULL CHECK (length(trim(message)) > 0),
  status varchar(16) NOT NULL DEFAULT 'simulated'
    CHECK (status = 'simulated'),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blind_candidate_notifications_created_idx
  ON blind_candidate_notifications (created_at DESC);
