"use client";

import { useState } from "react";
import { TrendingUp, Layers, DollarSign, BarChart3, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import NAVChart from "@/components/NAVChart";
import AllocationChart from "@/components/AllocationChart";
import PoolCard from "@/components/PoolCard";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";
import TransactionHistory from "@/components/TransactionHistory";
import {
  MOCK_POOL_INFO,
  MOCK_USER_POSITION,
  MOCK_ALLOCATION,
  MOCK_POOLS,
} from "@/lib/mockData";
import { formatXLM, formatNAV } from "@/lib/stellar";
import { WalletState } from "@/lib/wallet";

type ModalType = "deposit" | "withdraw" | null;

export default function Home() {
  const [wallet, setWallet]         = useState<WalletState>({ connected: false, publicKey: null, network: null });
  const [modal, setModal]           = useState<ModalType>(null);
  const [activePool, setActivePool] = useState("balanced");

  // Use mock data (swap for real contract calls post-deployment)
  const poolInfo    = MOCK_POOL_INFO;
  const userPos     = MOCK_USER_POSITION;
  const allocation  = MOCK_ALLOCATION;

  // Compute ROI
  const roi = userPos.depositedValue > 0n
    ? (((Number(userPos.shares) * Number(poolInfo.navPerShare) / 1_000_000) - Number(userPos.depositedValue)) / Number(userPos.depositedValue) * 100).toFixed(2)
    : "0.00";

  const currentValue = Number(userPos.shares) * Number(poolInfo.navPerShare) / 1_000_000 / 1e7;

  function handleDeposit(poolId: string) {
    setActivePool(poolId);
    setModal("deposit");
  }

  return (
    <div className="min-h-screen">
      <Navbar wallet={wallet} onWalletChange={setWallet} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Hero banner */}
        <div className="gradient-border rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Micro-Investment Pool
                </h1>
                <p className="text-slate-400 mt-1 text-sm max-w-md">
                  Pool small investments on Stellar Soroban. Earn proportional returns based on NAV.
                </p>
              </div>
              {!wallet.connected && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/3 rounded-lg px-3 py-2 border border-white/5">
                  <Wallet size={12} />
                  Connect wallet to start investing
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Pool Value"
            value={`${formatXLM(poolInfo.totalValue)} XLM`}
            sub="Across all pools"
            icon={<DollarSign size={14} />}
            trend="up"
            trendValue="+12.4% this month"
          />
          <StatCard
            label="Your Balance"
            value={`${currentValue.toFixed(2)} XLM`}
            sub={`${(Number(userPos.shares) / 1e7).toFixed(2)} DLS shares`}
            icon={<Wallet size={14} />}
            trend={parseFloat(roi) >= 0 ? "up" : "down"}
            trendValue={`${roi}% ROI`}
          />
          <StatCard
            label="NAV per Share"
            value={formatNAV(poolInfo.navPerShare)}
            sub="Current net asset value"
            icon={<TrendingUp size={14} />}
            trend="up"
            trendValue="+25% since inception"
          />
          <StatCard
            label="Total Shares"
            value={(Number(poolInfo.totalShares) / 1e7).toLocaleString()}
            sub="DLS tokens in circulation"
            icon={<Layers size={14} />}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <NAVChart />
          </div>
          <AllocationChart
            stablePct={allocation.stablePct}
            growthPct={allocation.growthPct}
          />
        </div>

        {/* Action buttons */}
        <div id="portfolio" className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setModal("deposit")}
            className="flex-1 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <BarChart3 size={16} />
            Deposit Funds
          </button>
          <button
            onClick={() => setModal("withdraw")}
            className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            Withdraw Funds
          </button>
        </div>

        {/* Pool cards */}
        <section id="pools">
          <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">
            Available Pools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_POOLS.map(pool => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onDeposit={handleDeposit}
                isActive={activePool === pool.id}
              />
            ))}
          </div>
        </section>

        {/* Transaction history */}
        <TransactionHistory />

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 py-4">
          DeFi Lite · Built on Stellar Soroban · Testnet
        </footer>
      </main>

      {/* Modals */}
      {modal === "deposit" && (
        <DepositModal
          onClose={() => setModal(null)}
          wallet={wallet}
          poolName={MOCK_POOLS.find(p => p.id === activePool)?.name ?? "Pool"}
          navPerShare={poolInfo.navPerShare}
        />
      )}
      {modal === "withdraw" && (
        <WithdrawModal
          onClose={() => setModal(null)}
          wallet={wallet}
          poolName={MOCK_POOLS.find(p => p.id === activePool)?.name ?? "Pool"}
          userShares={userPos.shares}
          navPerShare={poolInfo.navPerShare}
        />
      )}
    </div>
  );
}
