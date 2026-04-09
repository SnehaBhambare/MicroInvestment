//! Strategy / Allocation Contract
//! Manages how pooled funds are allocated across asset classes.
//! Supports multiple risk profiles: Conservative, Balanced, Aggressive.
//! Simulates yield generation and reports updated pool value back to Pool contract.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Symbol, Vec,
    log,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const ADMIN: Symbol       = symbol_short!("ADMIN");
const POOL_ADDR: Symbol   = symbol_short!("POOL");
const RISK_LEVEL: Symbol  = symbol_short!("RISK");
const TOTAL_AUM: Symbol   = symbol_short!("AUM");      // Assets Under Management
const LAST_REBAL: Symbol  = symbol_short!("REBAL");    // last rebalance ledger

// ─── Data Types ──────────────────────────────────────────────────────────────

/// Risk profile determines allocation percentages
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum RiskLevel {
    Conservative,  // 80% stable / 20% growth
    Balanced,      // 50% stable / 50% growth
    Aggressive,    // 20% stable / 80% growth
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Allocation {
    pub stable_pct: u32,   // percentage in stable assets (0-100)
    pub growth_pct: u32,   // percentage in growth assets (0-100)
    pub stable_value: i128,
    pub growth_value: i128,
    pub total_aum: i128,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PerformanceMetrics {
    pub total_aum: i128,
    pub simulated_apy_bps: u32,  // basis points e.g. 800 = 8% APY
    pub last_rebalance_ledger: u32,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct StrategyContract;

#[contractimpl]
impl StrategyContract {
    // ── Initialization ───────────────────────────────────────────────────────

    pub fn initialize(
        env: Env,
        admin: Address,
        pool_contract: Address,
        risk_level: RiskLevel,
    ) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        admin.require_auth();

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&POOL_ADDR, &pool_contract);
        env.storage().instance().set(&RISK_LEVEL, &risk_level);
        env.storage().instance().set(&TOTAL_AUM, &0_i128);
        env.storage().instance().set(&LAST_REBAL, &0_u32);
    }

    // ── Called by Pool on deposit ────────────────────────────────────────────

    /// Pool calls this when new funds arrive. Updates AUM tracking.
    pub fn on_deposit(env: Env, amount: i128) {
        Self::require_pool(&env);
        let aum: i128 = env.storage().instance().get(&TOTAL_AUM).unwrap_or(0);
        env.storage().instance().set(&TOTAL_AUM, &(aum + amount));
        log!(&env, "Strategy: received deposit of {}", amount);
    }

    // ── Rebalance ────────────────────────────────────────────────────────────

    /// Rebalance allocations based on current risk profile.
    /// In production this would trigger actual asset swaps.
    pub fn rebalance(env: Env, caller: Address) -> Allocation {
        caller.require_auth();
        Self::require_admin_or_pool(&env, &caller);

        let aum: i128 = env.storage().instance().get(&TOTAL_AUM).unwrap_or(0);
        let risk: RiskLevel = env.storage().instance().get(&RISK_LEVEL).unwrap();

        let (stable_pct, growth_pct) = match risk {
            RiskLevel::Conservative => (80_u32, 20_u32),
            RiskLevel::Balanced     => (50_u32, 50_u32),
            RiskLevel::Aggressive   => (20_u32, 80_u32),
        };

        let stable_value = (aum * stable_pct as i128) / 100;
        let growth_value = (aum * growth_pct as i128) / 100;

        env.storage().instance().set(&LAST_REBAL, &env.ledger().sequence());

        let alloc = Allocation {
            stable_pct,
            growth_pct,
            stable_value,
            growth_value,
            total_aum: aum,
        };

        log!(&env, "Rebalanced: stable={}%, growth={}%", stable_pct, growth_pct);
        alloc
    }

    // ── Simulate Yield ───────────────────────────────────────────────────────

    /// Simulate yield accrual and update pool value.
    /// In production, this would read from price oracles.
    /// Returns the new total pool value.
    pub fn simulate_yield(env: Env, admin: Address, yield_bps: u32) -> i128 {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        assert!(admin == stored_admin, "unauthorized");

        let aum: i128 = env.storage().instance().get(&TOTAL_AUM).unwrap_or(0);
        // yield = aum * yield_bps / 10_000
        let yield_amount = (aum * yield_bps as i128) / 10_000;
        let new_aum = aum + yield_amount;

        env.storage().instance().set(&TOTAL_AUM, &new_aum);

        // Notify pool contract of updated value
        let pool_addr: Address = env.storage().instance().get(&POOL_ADDR).unwrap();
        env.invoke_contract::<()>(
            &pool_addr,
            &symbol_short!("upd_val"),
            soroban_sdk::vec![&env,
                soroban_sdk::Val::from(env.current_contract_address()),
                soroban_sdk::Val::from(new_aum),
            ],
        );

        log!(&env, "Yield simulated: {}bps, new AUM={}", yield_bps, new_aum);
        new_aum
    }

    // ── Change Risk Level ────────────────────────────────────────────────────

    pub fn set_risk_level(env: Env, admin: Address, risk: RiskLevel) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        assert!(admin == stored_admin, "unauthorized");
        env.storage().instance().set(&RISK_LEVEL, &risk);
        log!(&env, "Risk level updated");
    }

    // ── View Functions ───────────────────────────────────────────────────────

    pub fn get_allocation(env: Env) -> Allocation {
        let aum: i128 = env.storage().instance().get(&TOTAL_AUM).unwrap_or(0);
        let risk: RiskLevel = env.storage().instance().get(&RISK_LEVEL).unwrap_or(RiskLevel::Balanced);

        let (stable_pct, growth_pct) = match risk {
            RiskLevel::Conservative => (80_u32, 20_u32),
            RiskLevel::Balanced     => (50_u32, 50_u32),
            RiskLevel::Aggressive   => (20_u32, 80_u32),
        };

        Allocation {
            stable_pct,
            growth_pct,
            stable_value: (aum * stable_pct as i128) / 100,
            growth_value: (aum * growth_pct as i128) / 100,
            total_aum: aum,
        }
    }

    pub fn get_metrics(env: Env) -> PerformanceMetrics {
        let risk: RiskLevel = env.storage().instance().get(&RISK_LEVEL).unwrap_or(RiskLevel::Balanced);
        let simulated_apy_bps = match risk {
            RiskLevel::Conservative => 400_u32,  // 4% APY
            RiskLevel::Balanced     => 800_u32,  // 8% APY
            RiskLevel::Aggressive   => 1500_u32, // 15% APY
        };

        PerformanceMetrics {
            total_aum: env.storage().instance().get(&TOTAL_AUM).unwrap_or(0),
            simulated_apy_bps,
            last_rebalance_ledger: env.storage().instance().get(&LAST_REBAL).unwrap_or(0),
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    fn require_pool(env: &Env) {
        let pool: Address = env.storage().instance().get(&POOL_ADDR).unwrap();
        pool.require_auth();
    }

    fn require_admin_or_pool(env: &Env, caller: &Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        let pool: Address  = env.storage().instance().get(&POOL_ADDR).unwrap();
        assert!(*caller == admin || *caller == pool, "unauthorized");
    }
}
