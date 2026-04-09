#!/usr/bin/env bash
# Fund a testnet account using Friendbot
# Usage: bash scripts/fund-testnet.sh <STELLAR_ADDRESS>

ADDRESS=${1:-""}
if [ -z "$ADDRESS" ]; then
  echo "Usage: bash scripts/fund-testnet.sh <STELLAR_ADDRESS>"
  exit 1
fi

echo "Funding $ADDRESS on testnet..."
curl -s "https://friendbot.stellar.org?addr=$ADDRESS" | python3 -m json.tool
echo "Done. Check balance at: https://stellar.expert/explorer/testnet/account/$ADDRESS"
