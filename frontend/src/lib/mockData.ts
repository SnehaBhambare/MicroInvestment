/**
 * Mock data for demo / development mode
 * Used when contracts are not yet deployed
 */

export const MOCK_POOL_INFO = {
  name: "DeFi Lite Balanced Pool",
  totalValue: 1_250_000_0000000n,   // 1,250,000 XLM
  totalShares: 1_000_000_0000000n,
  navPerShare: 1_250_000n,           // 1.25 (25% gain)
  feeBps: 50,
};

export const MOCK_USER_POSITION = {
  shares: 10_000_0000000n,
  depositedValue: 10_000_0000000n,
};

export const MOCK_ALLOCATION = {
  stablePct: 50,
  growthPct: 50,
  stableValue: 625_000_0000000n,
  growthValue: 625_000_0000000n,
  totalAum: 1_250_000_0000000n,
};

// Historical NAV data for chart (30 days)
export const MOCK_NAV_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const base = 1_000_000;
  const growth = Math.floor(base + (i / 29) * 250_000 + Math.sin(i * 0.5) * 20_000);
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    nav: growth / 1_000_000,
    value: growth,
  };
});

export const MOCK_TRANSACTIONS = [
  { id: "tx1", type: "deposit",  amount: 5_000_0000000n,  shares: 5_000_0000000n,  timestamp: Date.now() - 86400000 * 7,  status: "success" },
  { id: "tx2", type: "deposit",  amount: 3_000_0000000n,  shares: 2_800_0000000n,  timestamp: Date.now() - 86400000 * 3,  status: "success" },
  { id: "tx3", type: "withdraw", amount: 1_500_0000000n,  shares: 1_200_0000000n,  timestamp: Date.now() - 86400000 * 1,  status: "success" },
  { id: "tx4", type: "deposit",  amount: 3_500_0000000n,  shares: 3_200_0000000n,  timestamp: Date.now() - 3600000,        status: "pending" },
];

export const MOCK_POOLS = [
  {
    id: "conservative",
    name: "Conservative Pool",
    risk: "Low",
    apy: 4.0,
    totalValue: 500_000_0000000n,
    allocation: { stable: 80, growth: 20 },
    color: "#3b82f6",
  },
  {
    id: "balanced",
    name: "Balanced Pool",
    risk: "Medium",
    apy: 8.0,
    totalValue: 1_250_000_0000000n,
    allocation: { stable: 50, growth: 50 },
    color: "#22c55e",
  },
  {
    id: "aggressive",
    name: "Aggressive Pool",
    risk: "High",
    apy: 15.0,
    totalValue: 750_000_0000000n,
    allocation: { stable: 20, growth: 80 },
    color: "#f59e0b",
  },
];
