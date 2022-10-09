CREATE TABLE invites (
  token text PRIMARY KEY,
  created_at timestamp DEFAULT NOW()
);
