#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DeFi Lite — Soroban Contract Deployment Script (Testnet)
# Prerequisites: stellar CLI, Rust + wasm32 target installed
# Usage: bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

echo "🔧 Building contracts..."
cd contracts
cargo build --release --target wasm32-unknown-unknown
cd ..

WASM_DIR="contracts/target/wasm32-unknown-unknown/release"

echo "📦 Optimizing WASM..."
stellar contract optimize --wasm "$WASM_DIR/pool_contract.wasm"
stellar contract optimize --wasm "$WASM_DIR/pool_token_contract.wasm"
stellar contract optimize --wasm "$WASM_DIR/strategy_contract.wasm"

echo "🚀 Deploying Token Contract..."
TOKEN_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/pool_token_contract.optimized.wasm" \
  --source admin \
  --network $NETWORK)
echo "Token Contract ID: $TOKEN_ID"

echo "🚀 Deploying Strategy Contract..."
STRATEGY_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/strategy_contract.optimized.wasm" \
  --source admin \
  --network $NETWORK)
echo "Strategy Contract ID: $STRATEGY_ID"

echo "🚀 Deploying Pool Contract..."
POOL_ID=$(stellar contract deploy \
  --wasm "$WASM_DIR/pool_contract.optimized.wasm" \
  --source admin \
  --network $NETWORK)
echo "Pool Contract ID: $POOL_ID"

ADMIN_ADDRESS=$(stellar keys address admin)

echo "⚙️  Initializing Token Contract..."
stellar contract invoke \
  --id $TOKEN_ID \
  --source admin \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --pool_contract $POOL_ID \
  --name "DeFi Lite Share" \
  --symbol "DLS" \
  --decimals 7

echo "⚙️  Initializing Strategy Contract..."
stellar contract invoke \
  --id $STRATEGY_ID \
  --source admin \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --pool_contract $POOL_ID \
  --risk_level '{"Balanced": null}'

echo "⚙️  Initializing Pool Contract..."
stellar contract invoke \
  --id $POOL_ID \
  --source admin \
  --network $NETWORK \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --token_contract $TOKEN_ID \
  --strategy_contract $STRATEGY_ID \
  --pool_name "DeFi Lite Balanced Pool" \
  --fee_bps 50

echo ""
echo "✅ Deployment complete!"
echo "─────────────────────────────────────────────────────"
echo "NEXT_PUBLIC_POOL_CONTRACT_ID=$POOL_ID"
echo "NEXT_PUBLIC_TOKEN_CONTRACT_ID=$TOKEN_ID"
echo "NEXT_PUBLIC_STRATEGY_CONTRACT_ID=$STRATEGY_ID"
echo "─────────────────────────────────────────────────────"
echo "Add these to frontend/.env.local"

# Write to .env.local automatically
cat > frontend/.env.local <<EOF
NEXT_PUBLIC_POOL_CONTRACT_ID=$POOL_ID
NEXT_PUBLIC_TOKEN_CONTRACT_ID=$TOKEN_ID
NEXT_PUBLIC_STRATEGY_CONTRACT_ID=$STRATEGY_ID
EOF

echo "✅ Written to frontend/.env.local"
