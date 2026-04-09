/**
 * Stellar / Soroban SDK helpers
 * Wraps contract interactions for the frontend
 */

import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Contract,
  nativeToScVal,
  scValToNative,
  Address,
  xdr,
} from "@stellar/stellar-sdk";

// ─── Config ──────────────────────────────────────────────────────────────────

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";

// Replace with deployed contract IDs after running deploy script
export const CONTRACT_IDS = {
  pool:     process.env.NEXT_PUBLIC_POOL_CONTRACT_ID     ?? "CPOOL_PLACEHOLDER",
  token:    process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID    ?? "CTOKEN_PLACEHOLDER",
  strategy: process.env.NEXT_PUBLIC_STRATEGY_CONTRACT_ID ?? "CSTRATEGY_PLACEHOLDER",
};

// ─── RPC Client ──────────────────────────────────────────────────────────────

export const rpc = new SorobanRpc.Server(RPC_URL, { allowHttp: false });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PoolInfo {
  name: string;
  totalValue: bigint;
  totalShares: bigint;
  navPerShare: bigint;   // scaled by 1_000_000
  feeBps: number;
}

export interface UserPosition {
  shares: bigint;
  depositedValue: bigint;
}

export interface Allocation {
  stablePct: number;
  growthPct: number;
  stableValue: bigint;
  growthValue: bigint;
  totalAum: bigint;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format raw i128 (7 decimals) to human-readable XLM string */
export function formatXLM(raw: bigint, decimals = 7): string {
  const divisor = BigInt(10 ** decimals);
  const whole   = raw / divisor;
  const frac    = raw % divisor;
  return `${whole}.${frac.toString().padStart(decimals, "0").slice(0, 2)}`;
}

/** Format NAV (scaled by 1_000_000) */
export function formatNAV(raw: bigint): string {
  const whole = raw / 1_000_000n;
  const frac  = raw % 1_000_000n;
  return `${whole}.${frac.toString().padStart(6, "0").slice(0, 4)}`;
}

/** Parse human XLM string to stroops (7 decimals) */
export function parseXLM(amount: string): bigint {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = frac.padEnd(7, "0").slice(0, 7);
  return BigInt(whole) * 10_000_000n + BigInt(fracPadded);
}

// ─── Contract Calls ──────────────────────────────────────────────────────────

/**
 * Read pool info (no auth required)
 */
export async function getPoolInfo(): Promise<PoolInfo> {
  const contract = new Contract(CONTRACT_IDS.pool);
  const account  = await rpc.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN");

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_pool_info"))
    .setTimeout(30)
    .build();

  const result = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation failed: ${result.error}`);
  }

  const val = (result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  if (!val) throw new Error("No return value");

  const native = scValToNative(val) as Record<string, unknown>;
  return {
    name:        native.name as string,
    totalValue:  BigInt(native.total_value as number),
    totalShares: BigInt(native.total_shares as number),
    navPerShare: BigInt(native.nav_per_share as number),
    feeBps:      native.fee_bps as number,
  };
}

/**
 * Read user position
 */
export async function getUserPosition(userAddress: string): Promise<UserPosition> {
  const contract = new Contract(CONTRACT_IDS.pool);
  const account  = await rpc.getAccount(userAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(
      "get_user_position",
      new Address(userAddress).toScVal(),
    ))
    .setTimeout(30)
    .build();

  const result = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation failed: ${result.error}`);
  }

  const val = (result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  if (!val) throw new Error("No return value");

  const native = scValToNative(val) as Record<string, unknown>;
  return {
    shares:         BigInt(native.shares as number),
    depositedValue: BigInt(native.deposited_value as number),
  };
}

/**
 * Get strategy allocation
 */
export async function getAllocation(): Promise<Allocation> {
  const contract = new Contract(CONTRACT_IDS.strategy);
  const account  = await rpc.getAccount("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN");

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("get_allocation"))
    .setTimeout(30)
    .build();

  const result = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation failed: ${result.error}`);
  }

  const val = (result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  if (!val) throw new Error("No return value");

  const native = scValToNative(val) as Record<string, unknown>;
  return {
    stablePct:   native.stable_pct as number,
    growthPct:   native.growth_pct as number,
    stableValue: BigInt(native.stable_value as number),
    growthValue: BigInt(native.growth_value as number),
    totalAum:    BigInt(native.total_aum as number),
  };
}
