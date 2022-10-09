CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id uuid REFERENCES tokens,
  token text UNIQUE NOT NULL,
  created_at timestamp DEFAULT NOW(),
  deleted_at timestamp
);
