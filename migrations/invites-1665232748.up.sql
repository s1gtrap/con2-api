CREATE TABLE invites (
  token text PRIMARY KEY,
  inviter_id uuid REFERENCES tokens,
  created_at timestamp DEFAULT NOW()
);
