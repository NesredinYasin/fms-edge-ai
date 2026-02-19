CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  vehicle_code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  fuel_rate DOUBLE PRECISION,
  engine_temp DOUBLE PRECISION,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_ts ON telemetry(vehicle_id, ts DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  severity INT NOT NULL DEFAULT 1,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_ts ON alerts(vehicle_id, ts DESC);

-- Seed an admin user (email: admin@fms.local, password: Admin123!)
-- NOTE: hash will be replaced by runtime registration in real setups.
-- For simplicity, you can register via API instead.
