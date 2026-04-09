"use client";

import { ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2 } from "lucide-react";
import { MOCK_TRANSACTIONS } from "@/lib/mockData";
import clsx from "clsx";

export default function TransactionHistory() {
  return (
    <div id="history" className="gradient-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-white mb-4">Transaction History</h3>

      <div className="space-y-2">
        {MOCK_TRANSACTIONS.map(tx => {
          const isDeposit = tx.type === "deposit";
          const date = new Date(tx.timestamp).toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          });
          const amount = (Number(tx.amount) / 1e7).toFixed(2);

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors"
            >
              {/* Icon */}
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                isDeposit ? "bg-brand-500/15 text-brand-400" : "bg-amber-500/15 text-amber-400",
              )}>
                {isDeposit
                  ? <ArrowDownToLine size={14} />
                  : <ArrowUpFromLine size={14} />
                }
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-medium capitalize">{tx.type}</span>
                  {tx.status === "pending"
                    ? <Clock size={10} className="text-amber-400" />
                    : <CheckCircle2 size={10} className="text-brand-400" />
                  }
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{date}</div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <div className={clsx(
                  "text-xs font-semibold font-mono",
                  isDeposit ? "text-brand-400" : "text-amber-400",
                )}>
                  {isDeposit ? "+" : "-"}{amount} XLM
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {(Number(tx.shares) / 1e7).toFixed(2)} DLS
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
