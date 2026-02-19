import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.js";
import vehicleRoutes from "./routes/vehicles.js";
import telemetryRoutes from "./routes/telemetry.js";
import alertRoutes from "./routes/alerts.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: false }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);

app.use("/api/vehicles", requireAuth, vehicleRoutes);
app.use("/api/telemetry", requireAuth, telemetryRoutes);
app.use("/api/alerts", requireAuth, alertRoutes);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Backend running on :${port}`));
