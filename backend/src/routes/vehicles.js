import express from "express";
import { z } from "zod";
import { query } from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const r = await query("SELECT id, vehicle_code, label, created_at FROM vehicles ORDER BY id DESC");
  res.json(r.rows);
});

const createSchema = z.object({
  vehicle_code: z.string().min(2),
  label: z.string().min(1)
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { vehicle_code, label } = parsed.data;
  try {
    const r = await query(
      "INSERT INTO vehicles(vehicle_code,label) VALUES($1,$2) RETURNING id, vehicle_code, label, created_at",
      [vehicle_code, label]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(400).json({ error: "Vehicle exists or invalid", detail: String(e.message) });
  }
});

export default router;
