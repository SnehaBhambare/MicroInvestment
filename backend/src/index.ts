import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import poolRoutes from "./routes/pool";
import analyticsRoutes from "./routes/analytics";

dotenv.config();

const app  = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use("/api/pool",      poolRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`DeFi Lite backend running on port ${PORT}`);
});

export default app;
