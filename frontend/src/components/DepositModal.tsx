"use client";

import { useState } from "react";
import { X, ArrowDownToLine, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseXLM } from "@/lib/stellar";
import { WalletState } from "@/lib/wallet";

interface DepositModalProps {
  onClose: () => void;
  wallet: WalletState;
  poolName: string;
  navPerShare: bigint;
}

type TxStatus = "idle" | "signing" | "submitting" | "success" | "error";

export default function DepositModal({ onClose, wallet, poolName, navPerShare }: DepositModalProps) {
  const [amount, setAmount]   = useState("");
  const [status, setStatus]   = useState<TxStatus>("idle");
  const [errMsg, setErrMsg]   = useState("");
  const [txHash, setTxHash]   = useState("");

  // Estimated shares = amount / NAV
  const estimatedShares = (() => {
    try {
      const raw = parseXLM(amount || "0");
      if (raw === 0n || navPerShare === 0n) return "0.00";
      const shares = (raw * 1_000_000n) / navPerShare;
      return (Number(shares) / 1e7).toFixed(4);
    } catch { return "0.00"; }
  })();

  async function handleDeposit() {
    if (!wallet.connected) { alert("Connect wallet first"); return; }
    if (!amount || parseFloat(amount) <= 0) { alert("Enter a valid amount"); return; }

    setStatus("signing");
    setErrMsg("");

    try {
      // In production: build tx → sign with Freighter → submit to RPC
      // For demo we simulate the flow
      await new Promise(r => setTimeout(r, 1200)); // simulate signing
      setStatus("submitting");
      await new Promise(r => setTimeout(r, 1500)); // simulate submission
      setTxHash("demo_tx_" + Math.random().toString(36).slice(2, 10));
      setStatus("success");
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : "Transaction failed");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-md p-6 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <ArrowDownToLine size={16} className="text-brand-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Deposit</h2>
              <p className="text-xs text-slate-500">{poolName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {status === "success" ? (
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="text-brand-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Deposit Successful</p>
            <p className="text-xs text-slate-500 mt-1 font-mono break-all">{txHash}</p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Amount input */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1.5 block">Amount (XLM)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-semibold placeholder-slate-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">XLM</span>
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mb-5">
              {["10", "50", "100", "500"].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className="flex-1 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Estimate */}
            <div className="bg-white/3 rounded-lg p-3 mb-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Estimated shares</span>
                <span className="text-white font-mono">{estimatedShares} DLS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform fee (0.5%)</span>
                <span className="text-white font-mono">
                  {amount ? (parseFloat(amount) * 0.005).toFixed(4) : "0.0000"} XLM
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current NAV</span>
                <span className="text-white font-mono">
                  {(Number(navPerShare) / 1_000_000).toFixed(4)}
                </span>
              </div>
            </div>

            {errMsg && (
              <div className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-500/10 rounded-lg p-3">
                <AlertCircle size={14} />
                {errMsg}
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={status !== "idle" || !amount}
              className="w-full py-3 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
              {status === "signing"    && "Waiting for signature..."}
              {status === "submitting" && "Submitting transaction..."}
              {status === "idle"       && "Confirm Deposit"}
              {status === "error"      && "Retry"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
