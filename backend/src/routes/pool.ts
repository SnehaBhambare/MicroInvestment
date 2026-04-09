import { Router, Request, Response } from "express";
import { SorobanRpc, Contract, TransactionBuilder, Networks, BASE_FEE, scValToNative } from "@stellar/stellar-sdk";

const router = Router();
const rpc    = new SorobanRpc.Server(process.env.STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org");

const POOL_CONTRACT_ID = process.env.POOL_CONTRACT_ID ?? "";

/**
 * GET /api/pool/info
 * Returns current pool info (NAV, total value, shares)
 */
router.get("/info", async (_req: Request, res: Response) => {
  try {
    if (!POOL_CONTRACT_ID) {
      // Return mock data if contract not deployed
      return res.json({
        name: "DeFi Lite Balanced Pool",
        totalValue: "1250000",
        totalShares: "1000000",
        navPerShare: "1.25",
        feeBps: 50,
      });
    }

    const contract = new Contract(POOL_CONTRACT_ID);
    const account  = await rpc.getAccount(process.env.ADMIN_ADDRESS ?? "");

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(contract.call("get_pool_info"))
      .setTimeout(30)
      .build();

    const result = await rpc.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(result)) {
      throw new Error(result.error);
    }

    const val    = (result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result?.retval;
    const native = val ? scValToNative(val) : {};
    return res.json(native);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/pool/position/:address
 * Returns a user's position in the pool
 */
router.get("/position/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    // Mock response for demo
    return res.json({
      address,
      shares: "10000",
      depositedValue: "10000",
      currentValue: "12500",
      roi: "25.00",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
