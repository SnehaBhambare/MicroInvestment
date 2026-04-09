import { Router, Request, Response } from "express";

const router = Router();

// In-memory store for demo (use DB in production)
const navHistory: { date: string; nav: number }[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split("T")[0],
    nav: parseFloat((1.0 + (i / 29) * 0.25 + Math.sin(i * 0.5) * 0.02).toFixed(6)),
  };
});

/**
 * GET /api/analytics/nav-history
 * Returns 30-day NAV history for charting
 */
router.get("/nav-history", (_req: Request, res: Response) => {
  res.json({ data: navHistory });
});

/**
 * GET /api/analytics/pools
 * Returns all pool summaries
 */
router.get("/pools", (_req: Request, res: Response) => {
  res.json({
    pools: [
      { id: "conservative", name: "Conservative Pool", risk: "Low",    apy: 4.0,  tvl: 500000  },
      { id: "balanced",     name: "Balanced Pool",     risk: "Medium", apy: 8.0,  tvl: 1250000 },
      { id: "aggressive",   name: "Aggressive Pool",   risk: "High",   apy: 15.0, tvl: 750000  },
    ],
  });
});

/**
 * GET /api/analytics/metrics
 * Returns platform-wide metrics
 */
router.get("/metrics", (_req: Request, res: Response) => {
  res.json({
    totalTVL:       2500000,
    totalUsers:     1247,
    totalTxCount:   8934,
    avgAPY:         9.0,
    platformFeeEarned: 12500,
  });
});

export default router;
