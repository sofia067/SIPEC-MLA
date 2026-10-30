CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type varchar(80) NOT NULL,
  title varchar(160) NOT NULL,
  message varchar(500) NOT NULL,
  href varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX notifications_recipient_created_idx
  ON notifications (recipient_id, created_at DESC);

CREATE INDEX notifications_unread_recipient_idx
  ON notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL;
