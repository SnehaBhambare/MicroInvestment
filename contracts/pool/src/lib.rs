//! Pool Contract — core DeFi Lite investment pool
//! Handles deposits, withdrawals, NAV calculation, and inter-contract calls
//! to the Token and Strategy contracts.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Symbol, token, IntoVal,
    log,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const ADMIN: Symbol         = symbol_short!("ADMIN");
const TOKEN_ADDR: Symbol    = symbol_short!("TOKEN");
const STRATEGY_ADDR: Symbol = symbol_short!("STRATEGY");
const TOTAL_SHARES: Symbol  = symbol_short!("TSHARES");
const TOTAL_VALUE: Symbol   = symbol_short!("TVALUE");
const POOL_NAME: Symbol     = symbol_short!("PNAME");
const FEE_BPS: Symbol       = symbol_short!("FEEBPS");   // basis points (e.g. 50 = 0.5%)
const LOCKED: Symbol        = symbol_short!("LOCKED");   // reentrancy guard

// ─── User position storage key ───────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    UserPosition(Address),
}

// ─── Data Types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug)]
pub struct PoolInfo {
    pub name: soroban_sdk::String,
    pub total_value: i128,
    pub total_shares: i128,
    pub nav_per_share: i128,   // scaled by 1_000_000 (6 decimals)
    pub fee_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct UserPosition {
    pub shares: i128,
    pub deposited_value: i128,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct PoolContract;

#[contractimpl]
impl PoolContract {
    // ── Initialization ───────────────────────────────────────────────────────

    /// Initialize the pool. Must be called once after deployment.
    pub fn initialize(
        env: Env,
        admin: Address,
        token_contract: Address,
        strategy_contract: Address,
        pool_name: soroban_sdk::String,
        fee_bps: u32,
    ) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        admin.require_auth();

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&TOKEN_ADDR, &token_contract);
        env.storage().instance().set(&STRATEGY_ADDR, &strategy_contract);
        env.storage().instance().set(&POOL_NAME, &pool_name);
        env.storage().instance().set(&TOTAL_SHARES, &0_i128);
        env.storage().instance().set(&TOTAL_VALUE, &0_i128);
        env.storage().instance().set(&FEE_BPS, &fee_bps);
        env.storage().instance().set(&LOCKED, &false);

        log!(&env, "Pool initialized: {}", pool_name);
    }

    // ── Deposit ──────────────────────────────────────────────────────────────

    /// Deposit XLM-equivalent tokens into the pool.
    /// Mints pool share tokens proportional to current NAV.
    pub fn deposit(env: Env, user: Address, amount: i128, asset_token: Address) -> i128 {
        user.require_auth();
        Self::assert_not_locked(&env);
        Self::set_lock(&env, true);

        assert!(amount > 0, "amount must be positive");

        // Transfer asset from user to pool contract
        let asset_client = token::Client::new(&env, &asset_token);
        asset_client.transfer(&user, &env.current_contract_address(), &amount);

        // Calculate fee
        let fee_bps: u32 = env.storage().instance().get(&FEE_BPS).unwrap_or(0);
        let fee = (amount * fee_bps as i128) / 10_000;
        let net_amount = amount - fee;

        // Calculate shares to mint based on NAV
        let total_shares: i128 = env.storage().instance().get(&TOTAL_SHARES).unwrap_or(0);
        let total_value: i128  = env.storage().instance().get(&TOTAL_VALUE).unwrap_or(0);

        let shares_to_mint = if total_shares == 0 || total_value == 0 {
            // First deposit: 1:1 ratio scaled to 6 decimals
            net_amount
        } else {
            // shares = net_amount * total_shares / total_value
            (net_amount * total_shares) / total_value
        };

        assert!(shares_to_mint > 0, "shares to mint must be positive");

        // Update pool state
        env.storage().instance().set(&TOTAL_VALUE, &(total_value + net_amount));
        env.storage().instance().set(&TOTAL_SHARES, &(total_shares + shares_to_mint));

        // Update user position
        let user_key = DataKey::UserPosition(user.clone());
        let mut position: UserPosition = env.storage().persistent()
            .get(&user_key)
            .unwrap_or(UserPosition { shares: 0, deposited_value: 0 });
        position.shares += shares_to_mint;
        position.deposited_value += net_amount;
        env.storage().persistent().set(&user_key, &position);

        // Mint pool share tokens to user via Token contract
        let token_addr: Address = env.storage().instance().get(&TOKEN_ADDR).unwrap();
        env.invoke_contract::<()>(
            &token_addr,
            &symbol_short!("mint"),
            soroban_sdk::vec![&env,
                user.clone().into_val(&env),
                shares_to_mint.into_val(&env),
            ],
        );

        // Notify strategy contract of new funds
        let strategy_addr: Address = env.storage().instance().get(&STRATEGY_ADDR).unwrap();
        env.invoke_contract::<()>(
            &strategy_addr,
            &symbol_short!("on_dep"),
            soroban_sdk::vec![&env,
                net_amount.into_val(&env),
            ],
        );

        Self::set_lock(&env, false);

        log!(&env, "Deposit: user={}, amount={}, shares={}", user, net_amount, shares_to_mint);
        shares_to_mint
    }

    // ── Withdraw ─────────────────────────────────────────────────────────────

    /// Burn pool share tokens and return proportional assets to user.
    pub fn withdraw(env: Env, user: Address, shares: i128, asset_token: Address) -> i128 {
        user.require_auth();
        Self::assert_not_locked(&env);
        Self::set_lock(&env, true);

        assert!(shares > 0, "shares must be positive");

        let user_key = DataKey::UserPosition(user.clone());
        let mut position: UserPosition = env.storage().persistent()
            .get(&user_key)
            .expect("no position found");

        assert!(position.shares >= shares, "insufficient shares");

        let total_shares: i128 = env.storage().instance().get(&TOTAL_SHARES).unwrap();
        let total_value: i128  = env.storage().instance().get(&TOTAL_VALUE).unwrap();

        // proportional_value = shares * total_value / total_shares
        let proportional_value = (shares * total_value) / total_shares;

        // Apply withdrawal fee
        let fee_bps: u32 = env.storage().instance().get(&FEE_BPS).unwrap_or(0);
        let fee = (proportional_value * fee_bps as i128) / 10_000;
        let payout = proportional_value - fee;

        // Update pool state
        env.storage().instance().set(&TOTAL_VALUE, &(total_value - proportional_value));
        env.storage().instance().set(&TOTAL_SHARES, &(total_shares - shares));

        // Update user position
        position.shares -= shares;
        position.deposited_value = if position.shares == 0 { 0 } else {
            position.deposited_value - (position.deposited_value * shares / (position.shares + shares))
        };
        env.storage().persistent().set(&user_key, &position);

        // Burn pool share tokens
        let token_addr: Address = env.storage().instance().get(&TOKEN_ADDR).unwrap();
        env.invoke_contract::<()>(
            &token_addr,
            &symbol_short!("burn"),
            soroban_sdk::vec![&env,
                user.clone().into_val(&env),
                shares.into_val(&env),
            ],
        );

        // Transfer assets back to user
        let asset_client = token::Client::new(&env, &asset_token);
        asset_client.transfer(&env.current_contract_address(), &user, &payout);

        Self::set_lock(&env, false);

        log!(&env, "Withdraw: user={}, shares={}, payout={}", user, shares, payout);
        payout
    }

    // ── NAV / Pool Info ──────────────────────────────────────────────────────

    /// Returns current pool info including NAV per share.
    pub fn get_pool_info(env: Env) -> PoolInfo {
        let total_shares: i128 = env.storage().instance().get(&TOTAL_SHARES).unwrap_or(0);
        let total_value: i128  = env.storage().instance().get(&TOTAL_VALUE).unwrap_or(0);
        let fee_bps: u32       = env.storage().instance().get(&FEE_BPS).unwrap_or(0);
        let name: soroban_sdk::String = env.storage().instance().get(&POOL_NAME).unwrap();

        let nav_per_share = if total_shares == 0 {
            1_000_000_i128 // 1.0 scaled
        } else {
            (total_value * 1_000_000) / total_shares
        };

        PoolInfo { name, total_value, total_shares, nav_per_share, fee_bps }
    }

    /// Returns a user's current position.
    pub fn get_user_position(env: Env, user: Address) -> UserPosition {
        let user_key = DataKey::UserPosition(user);
        env.storage().persistent()
            .get(&user_key)
            .unwrap_or(UserPosition { shares: 0, deposited_value: 0 })
    }

    // ── Admin: update pool value (called by strategy/oracle) ─────────────────

    /// Admin or strategy contract updates total pool value (reflects P&L).
    pub fn update_pool_value(env: Env, caller: Address, new_value: i128) {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        let strategy: Address = env.storage().instance().get(&STRATEGY_ADDR).unwrap();
        assert!(caller == admin || caller == strategy, "unauthorized");
        assert!(new_value >= 0, "value cannot be negative");
        env.storage().instance().set(&TOTAL_VALUE, &new_value);
        log!(&env, "Pool value updated to {}", new_value);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    fn assert_not_locked(env: &Env) {
        let locked: bool = env.storage().instance().get(&LOCKED).unwrap_or(false);
        assert!(!locked, "reentrancy detected");
    }

    fn set_lock(env: &Env, val: bool) {
        env.storage().instance().set(&LOCKED, &val);
    }
}
