//! Unit tests for the Pool Token Contract

#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn deploy(env: &Env) -> (Address, Address, Address, PoolTokenContractClient) {
    let admin   = Address::generate(env);
    let pool    = Address::generate(env);
    let id      = env.register_contract(None, PoolTokenContract);
    let client  = PoolTokenContractClient::new(env, &id);

    client.initialize(
        &admin,
        &pool,
        &String::from_str(env, "DeFi Lite Share"),
        &String::from_str(env, "DLS"),
        &7_u32,
    );

    (admin, pool, id, client)
}

#[test]
fn test_initial_supply_zero() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, _, client) = deploy(&env);
    assert_eq!(client.total_supply(), 0);
}

#[test]
fn test_mint_increases_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, _, client) = deploy(&env);
    let user = Address::generate(&env);

    client.mint(&user, &1_000_000_i128);
    assert_eq!(client.balance(&user), 1_000_000);
    assert_eq!(client.total_supply(), 1_000_000);
}

#[test]
fn test_burn_decreases_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, _, client) = deploy(&env);
    let user = Address::generate(&env);

    client.mint(&user, &1_000_000_i128);
    client.burn(&user, &400_000_i128);
    assert_eq!(client.balance(&user), 600_000);
    assert_eq!(client.total_supply(), 600_000);
}

#[test]
#[should_panic(expected = "insufficient balance to burn")]
fn test_burn_more_than_balance_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, _, client) = deploy(&env);
    let user = Address::generate(&env);

    client.mint(&user, &100_i128);
    client.burn(&user, &200_i128);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, _, client) = deploy(&env);
    let alice = Address::generate(&env);
    let bob   = Address::generate(&env);

    client.mint(&alice, &1_000_i128);
    client.transfer(&alice, &bob, &300_i128);

    assert_eq!(client.balance(&alice), 700);
    assert_eq!(client.balance(&bob), 300);
}

#[test]
fn test_metadata() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, _, client) = deploy(&env);

    assert_eq!(client.name(), String::from_str(&env, "DeFi Lite Share"));
    assert_eq!(client.symbol(), String::from_str(&env, "DLS"));
    assert_eq!(client.decimals(), 7);
}
