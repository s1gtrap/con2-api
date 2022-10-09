CREATE TABLE reports (
  id SERIAL,
  reporter uuid REFERENCES tokens,
  stop integer,
  image text,
  x integer,
  y integer,
  name text,
  lat real,
  lng real,
  created_at timestamp DEFAULT NOW()
);
