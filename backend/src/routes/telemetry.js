import express from "express";
import { z } from "zod";
import { query } from "../db.js";

const router = express.Router();

router.get("/latest", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 500);
  const r = await query(
    `SELECT t.id, t.ts, t.lat, t.lon, t.speed_kmh, t.fuel_rate, t.engine_temp,
            v.vehicle_code, v.label
     FROM telemetry t
     JOIN vehicles v ON v.id = t.vehicle_id
     ORDER BY t.ts DESC
     LIMIT $1`,
    [limit]
  );
  res.json(r.rows);
});

const ingestSchema = z.object({
  vehicle_code: z.string().min(1),
  ts: z.string().datetime(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  speed_kmh: z.number().optional(),
  fuel_rate: z.number().optional(),
  engine_temp: z.number().optional(),
  raw: z.any().optional()
});

router.post("/ingest", async (req, res) => {
  const parsed = ingestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const d = parsed.data;

  const v = await query("SELECT id FROM vehicles WHERE vehicle_code=$1", [d.vehicle_code]);
  if (v.rowCount === 0) return res.status(400).json({ error: "Unknown vehicle_code" });

  const vehicle_id = v.rows[0].id;

  await query(
    `INSERT INTO telemetry(vehicle_id, ts, lat, lon, speed_kmh, fuel_rate, engine_temp, raw)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [vehicle_id, d.ts, d.lat ?? null, d.lon ?? null, d.speed_kmh ?? null, d.fuel_rate ?? null, d.engine_temp ?? null, d.raw ?? null]
  );

  res.json({ ok: true });
});

export default router;
