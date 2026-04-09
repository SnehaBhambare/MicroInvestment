"use client";

import { useState } from "react";
import { X, ArrowUpFromLine, CheckCircle2, AlertCircle } from "lucide-react";
import { WalletState } from "@/lib/wallet";

interface WithdrawModalProps {
  onClose: () => void;
  wallet: WalletState;
  poolName: string;
  userShares: bigint;
  navPerShare: bigint;
}

type TxStatus = "idle" | "signing" | "submitting" | "success" | "error";

export default function WithdrawModal({
  onClose, wallet, poolName, userShares, navPerShare,
}: WithdrawModalProps) {
  const [pct, setPct]       = useState(50);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [errMsg, setErrMsg] = useState("");
  const [txHash, setTxHash] = useState("");

  const sharesToBurn = (userShares * BigInt(pct)) / 100n;
  const estimatedXLM = navPerShare > 0n
    ? Number((sharesToBurn * navPerShare) / 1_000_000n) / 1e7
    : 0;

  async function handleWithdraw() {
    if (!wallet.connected) { alert("Connect wallet first"); return; }
    if (userShares === 0n) { alert("No shares to withdraw"); return; }

    setStatus("signing");
    setErrMsg("");
    try {
      await new Promise(r => setTimeout(r, 1200));
      setStatus("submitting");
      await new Promise(r => setTimeout(r, 1500));
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <ArrowUpFromLine size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Withdraw</h2>
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
            <p className="text-white font-semibold">Withdrawal Successful</p>
            <p className="text-xs text-slate-500 mt-1 font-mono break-all">{txHash}</p>
            <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium">
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Percentage slider */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Withdraw percentage</span>
                <span className="text-white font-semibold">{pct}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={pct}
                onChange={e => setPct(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>1%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            {/* Quick pct buttons */}
            <div className="flex gap-2 mb-5">
              {[25, 50, 75, 100].map(v => (
                <button
                  key={v}
                  onClick={() => setPct(v)}
                  className={`flex-1 py-1.5 rounded-md text-xs transition-colors ${
                    pct === v
                      ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                      : "bg-white/5 hover:bg-white/10 text-slate-400"
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white/3 rounded-lg p-3 mb-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Shares to burn</span>
                <span className="text-white font-mono">{(Number(sharesToBurn) / 1e7).toFixed(4)} DLS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated return</span>
                <span className="text-white font-mono">{estimatedXLM.toFixed(4)} XLM</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Withdrawal fee (0.5%)</span>
                <span className="text-white font-mono">{(estimatedXLM * 0.005).toFixed(4)} XLM</span>
              </div>
            </div>

            {errMsg && (
              <div className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-500/10 rounded-lg p-3">
                <AlertCircle size={14} />
                {errMsg}
              </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={status !== "idle"}
              className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
              {status === "signing"    && "Waiting for signature..."}
              {status === "submitting" && "Submitting transaction..."}
              {status === "idle"       && `Withdraw ${pct}%`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
