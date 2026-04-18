@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM DeFi Lite — Soroban Contract Deployment Script (Windows / Testnet)
REM Run from project root: scripts\deploy.cmd
REM ─────────────────────────────────────────────────────────────────────────

echo.
echo === DeFi Lite Deployment ===
echo.

REM Step 1: Check tools
where stellar >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: stellar CLI not found.
    exit /b 1
)
where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Rust/cargo not found. Install from https://rustup.rs
    exit /b 1
)

REM Step 2: Add WASM target
echo [1/5] Adding wasm32 target...
rustup target add wasm32-unknown-unknown

REM Step 3: Build contracts
echo [2/5] Building contracts...
cd contracts
cargo build --release --target wasm32-unknown-unknown
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b 1
)
cd ..

set WASM=contracts\target\wasm32-unknown-unknown\release

REM Step 4: Setup and fund admin account
echo [3/5] Setting up admin account...
stellar keys generate admin --network testnet 2>nul
stellar keys address admin > %TEMP%\admin_addr.txt 2>&1
set /p ADMIN_ADDRESS=<%TEMP%\admin_addr.txt
echo Admin address: %ADMIN_ADDRESS%
echo Funding via Friendbot...
curl -s "https://friendbot.stellar.org?addr=%ADMIN_ADDRESS%" >nul
echo Funded!

REM Step 5: Deploy contracts using stellar contract install + deploy
echo [4/5] Deploying contracts...

echo Deploying Token contract...
stellar contract deploy --wasm %WASM%\pool_token_contract.wasm --source admin --network testnet --ignore-checks > %TEMP%\token_id.txt 2>&1
type %TEMP%\token_id.txt
for /f "tokens=* delims=" %%i in ('findstr /r "^C" %TEMP%\token_id.txt') do set TOKEN_ID=%%i
echo TOKEN_ID=%TOKEN_ID%

echo Deploying Strategy contract...
stellar contract deploy --wasm %WASM%\strategy_contract.wasm --source admin --network testnet --ignore-checks > %TEMP%\strategy_id.txt 2>&1
type %TEMP%\strategy_id.txt
for /f "tokens=* delims=" %%i in ('findstr /r "^C" %TEMP%\strategy_id.txt') do set STRATEGY_ID=%%i
echo STRATEGY_ID=%STRATEGY_ID%

echo Deploying Pool contract...
stellar contract deploy --wasm %WASM%\pool_contract.wasm --source admin --network testnet --ignore-checks > %TEMP%\pool_id.txt 2>&1
type %TEMP%\pool_id.txt
for /f "tokens=* delims=" %%i in ('findstr /r "^C" %TEMP%\pool_id.txt') do set POOL_ID=%%i
echo POOL_ID=%POOL_ID%

if "%TOKEN_ID%"=="" (
    echo ERROR: Failed to capture Token contract ID. Check output above.
    exit /b 1
)
if "%POOL_ID%"=="" (
    echo ERROR: Failed to capture Pool contract ID. Check output above.
    exit /b 1
)
if "%STRATEGY_ID%"=="" (
    echo ERROR: Failed to capture Strategy contract ID. Check output above.
    exit /b 1
)

REM Step 6: Initialize contracts
echo [5/5] Initializing contracts...

stellar contract invoke --id %TOKEN_ID% --source admin --network testnet -- initialize --admin %ADMIN_ADDRESS% --pool_contract %POOL_ID% --name "DeFi Lite Share" --symbol "DLS" --decimals 7

stellar contract invoke --id %STRATEGY_ID% --source admin --network testnet -- initialize --admin %ADMIN_ADDRESS% --pool_contract %POOL_ID% --risk_level Balanced

stellar contract invoke --id %POOL_ID% --source admin --network testnet -- initialize --admin %ADMIN_ADDRESS% --token_contract %TOKEN_ID% --strategy_contract %STRATEGY_ID% --pool_name "DeFi Lite Balanced Pool" --fee_bps 50

REM Write .env.local
(
echo NEXT_PUBLIC_POOL_CONTRACT_ID=%POOL_ID%
echo NEXT_PUBLIC_TOKEN_CONTRACT_ID=%TOKEN_ID%
echo NEXT_PUBLIC_STRATEGY_CONTRACT_ID=%STRATEGY_ID%
) > frontend\.env.local

echo.
echo =====================================================
echo  Deployment Complete!
echo =====================================================
echo  Pool Contract:     %POOL_ID%
echo  Token Contract:    %TOKEN_ID%
echo  Strategy Contract: %STRATEGY_ID%
echo =====================================================
