import express from "express";
import { z } from "zod";
import { query } from "../db.js";

const router = express.Router();

router.get("/latest", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 500);
  const r = await query(
    `SELECT a.id, a.ts, a.type, a.severity, a.message, a.details,
            v.vehicle_code, v.label
     FROM alerts a
     JOIN vehicles v ON v.id = a.vehicle_id
     ORDER BY a.ts DESC
     LIMIT $1`,
    [limit]
  );
  res.json(r.rows);
});

const alertSchema = z.object({
  vehicle_code: z.string().min(1),
  ts: z.string().datetime(),
  type: z.string().min(1),
  severity: z.number().int().min(1).max(5).default(2),
  message: z.string().min(1),
  details: z.any().optional()
});

router.post("/ingest", async (req, res) => {
  const parsed = alertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const d = parsed.data;
  const v = await query("SELECT id FROM vehicles WHERE vehicle_code=$1", [d.vehicle_code]);
  if (v.rowCount === 0) return res.status(400).json({ error: "Unknown vehicle_code" });

  const vehicle_id = v.rows[0].id;

  await query(
    `INSERT INTO alerts(vehicle_id, ts, type, severity, message, details)
     VALUES($1,$2,$3,$4,$5,$6)`,
    [vehicle_id, d.ts, d.type, d.severity, d.message, d.details ?? null]
  );

  res.json({ ok: true });
});

export default router;
