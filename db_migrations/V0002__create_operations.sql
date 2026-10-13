CREATE TABLE IF NOT EXISTS operations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(6) NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  commander_token VARCHAR(64) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS operation_events (
  id SERIAL PRIMARY KEY,
  operation_id INTEGER NOT NULL REFERENCES operations(id),
  client_id VARCHAR(64) NOT NULL,
  kind VARCHAR(32) NOT NULL,
  danger BOOLEAN NOT NULL DEFAULT FALSE,
  summary TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (operation_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_operation_events_op_id ON operation_events(operation_id, id);
