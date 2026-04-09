"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Menu, X } from "lucide-react";
import { connectWallet, shortenAddress, isFreighterInstalled, WalletState } from "@/lib/wallet";

interface NavbarProps {
  wallet: WalletState;
  onWalletChange: (w: WalletState) => void;
}

export default function Navbar({ wallet, onWalletChange }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      const state = await connectWallet();
      onWalletChange(state);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      alert(msg);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-semibold text-white text-lg">DeFi Lite</span>
            <span className="hidden sm:inline text-xs text-slate-500 ml-1 font-mono">on Stellar</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#pools"     className="hover:text-white transition-colors">Pools</a>
            <a href="#portfolio" className="hover:text-white transition-colors">Portfolio</a>
            <a href="#history"   className="hover:text-white transition-colors">History</a>
          </div>

          {/* Wallet button */}
          <div className="flex items-center gap-3">
            {wallet.connected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 text-sm font-mono">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                {shortenAddress(wallet.publicKey ?? "")}
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Wallet size={15} />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-white/5 flex flex-col gap-3 text-sm text-slate-400">
            <a href="#pools"     className="hover:text-white" onClick={() => setMenuOpen(false)}>Pools</a>
            <a href="#portfolio" className="hover:text-white" onClick={() => setMenuOpen(false)}>Portfolio</a>
            <a href="#history"   className="hover:text-white" onClick={() => setMenuOpen(false)}>History</a>
          </div>
        )}
      </div>
    </nav>
  );
}
