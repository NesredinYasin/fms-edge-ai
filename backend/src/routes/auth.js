import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db.js";

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().optional()
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password, role = "manager" } = parsed.data;
  const password_hash = await bcrypt.hash(password, 12);

  try {
    const r = await query(
      "INSERT INTO users(email, password_hash, role) VALUES($1,$2,$3) RETURNING id,email,role",
      [email, password_hash, role]
    );
    res.json({ user: r.rows[0] });
  } catch (e) {
    res.status(400).json({ error: "User exists or invalid", detail: String(e.message) });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password } = parsed.data;
  const r = await query("SELECT id,email,password_hash,role FROM users WHERE email=$1", [email]);
  if (r.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });

  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;
