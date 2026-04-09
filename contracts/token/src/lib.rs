//! Pool Share Token Contract
//! Custom Stellar token representing ownership shares in the investment pool.
//! Implements the Soroban token interface with mint/burn controlled by the pool.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Symbol, String,
    log,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const ADMIN: Symbol      = symbol_short!("ADMIN");
const POOL: Symbol       = symbol_short!("POOL");
const NAME: Symbol       = symbol_short!("NAME");
const SYMBOL_KEY: Symbol = symbol_short!("SYMBOL");
const DECIMALS: Symbol   = symbol_short!("DECIMALS");
const TOTAL_SUPPLY: Symbol = symbol_short!("SUPPLY");

// ─── Data Types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u32,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct PoolTokenContract;

#[contractimpl]
impl PoolTokenContract {
    // ── Initialization ───────────────────────────────────────────────────────

    pub fn initialize(
        env: Env,
        admin: Address,
        pool_contract: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        admin.require_auth();

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&POOL, &pool_contract);
        env.storage().instance().set(&NAME, &name);
        env.storage().instance().set(&SYMBOL_KEY, &symbol);
        env.storage().instance().set(&DECIMALS, &decimals);
        env.storage().instance().set(&TOTAL_SUPPLY, &0_i128);
    }

    // ── Mint (pool only) ─────────────────────────────────────────────────────

    /// Mint new share tokens to a user. Only callable by the pool contract.
    pub fn mint(env: Env, to: Address, amount: i128) {
        Self::require_pool(&env);
        assert!(amount > 0, "mint amount must be positive");

        let balance_key = Self::balance_key(&env, &to);
        let current: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        env.storage().persistent().set(&balance_key, &(current + amount));

        let supply: i128 = env.storage().instance().get(&TOTAL_SUPPLY).unwrap_or(0);
        env.storage().instance().set(&TOTAL_SUPPLY, &(supply + amount));

        log!(&env, "Mint: to={}, amount={}", to, amount);
    }

    // ── Burn (pool only) ─────────────────────────────────────────────────────

    /// Burn share tokens from a user. Only callable by the pool contract.
    pub fn burn(env: Env, from: Address, amount: i128) {
        Self::require_pool(&env);
        assert!(amount > 0, "burn amount must be positive");

        let balance_key = Self::balance_key(&env, &from);
        let current: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        assert!(current >= amount, "insufficient balance to burn");

        env.storage().persistent().set(&balance_key, &(current - amount));

        let supply: i128 = env.storage().instance().get(&TOTAL_SUPPLY).unwrap_or(0);
        env.storage().instance().set(&TOTAL_SUPPLY, &(supply - amount));

        log!(&env, "Burn: from={}, amount={}", from, amount);
    }

    // ── Standard Token Interface ─────────────────────────────────────────────

    pub fn balance(env: Env, account: Address) -> i128 {
        let key = Self::balance_key(&env, &account);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_SUPPLY).unwrap_or(0)
    }

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&NAME).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&SYMBOL_KEY).unwrap()
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DECIMALS).unwrap_or(7)
    }

    pub fn metadata(env: Env) -> TokenMetadata {
        TokenMetadata {
            name: env.storage().instance().get(&NAME).unwrap(),
            symbol: env.storage().instance().get(&SYMBOL_KEY).unwrap(),
            decimals: env.storage().instance().get(&DECIMALS).unwrap_or(7),
        }
    }

    // ── Transfer (user-to-user share transfer) ───────────────────────────────

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "transfer amount must be positive");

        let from_key = Self::balance_key(&env, &from);
        let to_key   = Self::balance_key(&env, &to);

        let from_bal: i128 = env.storage().persistent().get(&from_key).unwrap_or(0);
        assert!(from_bal >= amount, "insufficient balance");

        env.storage().persistent().set(&from_key, &(from_bal - amount));
        let to_bal: i128 = env.storage().persistent().get(&to_key).unwrap_or(0);
        env.storage().persistent().set(&to_key, &(to_bal + amount));

        log!(&env, "Transfer: from={}, to={}, amount={}", from, to, amount);
    }

    // ── Admin: update pool address ───────────────────────────────────────────

    pub fn set_pool(env: Env, admin: Address, new_pool: Address) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        assert!(admin == stored_admin, "unauthorized");
        env.storage().instance().set(&POOL, &new_pool);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    fn require_pool(env: &Env) {
        let pool: Address = env.storage().instance().get(&POOL).unwrap();
        pool.require_auth();
    }

    fn balance_key(env: &Env, account: &Address) -> soroban_sdk::Val {
        (symbol_short!("BAL"), account.clone()).into_val(env)
    }
}
