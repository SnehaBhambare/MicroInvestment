/**
 * Freighter wallet integration
 * Handles connect, sign, and submit transactions
 */

declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>;
      getNetwork: () => Promise<string>;
    };
  }
}

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  network: string | null;
}

/** Check if Freighter is installed */
export function isFreighterInstalled(): boolean {
  return typeof window !== "undefined" && !!window.freighter;
}

/** Connect to Freighter wallet */
export async function connectWallet(): Promise<WalletState> {
  if (!isFreighterInstalled()) {
    throw new Error("Freighter wallet not installed. Please install it from freighter.app");
  }

  const connected = await window.freighter!.isConnected();
  if (!connected) {
    throw new Error("Please unlock your Freighter wallet");
  }

  const publicKey = await window.freighter!.getPublicKey();
  const network   = await window.freighter!.getNetwork();

  return { connected: true, publicKey, network };
}

/** Sign a transaction XDR with Freighter */
export async function signTransaction(xdr: string, networkPassphrase: string): Promise<string> {
  if (!isFreighterInstalled()) throw new Error("Freighter not installed");
  return window.freighter!.signTransaction(xdr, { networkPassphrase });
}

/** Shorten a Stellar address for display */
export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
