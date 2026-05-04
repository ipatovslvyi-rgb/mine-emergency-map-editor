CREATE TABLE IF NOT EXISTS license_keys (
  id SERIAL PRIMARY KEY,
  key_code VARCHAR(64) NOT NULL UNIQUE,
  description TEXT,
  expires_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);