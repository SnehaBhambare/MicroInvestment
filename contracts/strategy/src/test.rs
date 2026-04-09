//! Unit tests for the Strategy Contract

#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn deploy(env: &Env, risk: RiskLevel) -> (Address, Address, StrategyContractClient) {
    let admin  = Address::generate(env);
    let pool   = Address::generate(env);
    let id     = env.register_contract(None, StrategyContract);
    let client = StrategyContractClient::new(env, &id);

    client.initialize(&admin, &pool, &risk);
    (admin, pool, client)
}

#[test]
fn test_balanced_allocation() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, pool, client) = deploy(&env, RiskLevel::Balanced);

    // Simulate a deposit
    client.on_deposit(&1_000_000_i128);

    let alloc = client.get_allocation();
    assert_eq!(alloc.stable_pct, 50);
    assert_eq!(alloc.growth_pct, 50);
    assert_eq!(alloc.stable_value, 500_000);
    assert_eq!(alloc.growth_value, 500_000);
}

#[test]
fn test_conservative_allocation() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, client) = deploy(&env, RiskLevel::Conservative);

    client.on_deposit(&1_000_000_i128);

    let alloc = client.get_allocation();
    assert_eq!(alloc.stable_pct, 80);
    assert_eq!(alloc.growth_pct, 20);
}

#[test]
fn test_aggressive_allocation() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, client) = deploy(&env, RiskLevel::Aggressive);

    client.on_deposit(&1_000_000_i128);

    let alloc = client.get_allocation();
    assert_eq!(alloc.stable_pct, 20);
    assert_eq!(alloc.growth_pct, 80);
}

#[test]
fn test_metrics_apy() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, client) = deploy(&env, RiskLevel::Aggressive);

    let metrics = client.get_metrics();
    assert_eq!(metrics.simulated_apy_bps, 1500); // 15% APY
}

#[test]
fn test_set_risk_level() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, _, client) = deploy(&env, RiskLevel::Balanced);

    client.set_risk_level(&admin, &RiskLevel::Conservative);
    let metrics = client.get_metrics();
    assert_eq!(metrics.simulated_apy_bps, 400); // 4% APY
}
