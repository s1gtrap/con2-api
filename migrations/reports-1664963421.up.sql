CREATE TABLE reports (
  id SERIAL,
  reporter uuid REFERENCES tokens,
  stop integer,
  image text,
  name text,
  lat real,
  lng real,
  created_at timestamp DEFAULT NOW()
);
