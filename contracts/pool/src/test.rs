//! Unit tests for the Pool Contract

#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    Address, Env, String,
};

fn setup_env() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let admin    = Address::generate(&env);
    let user1    = Address::generate(&env);
    let token_id = env.register_contract(None, crate::PoolContract);
    let pool_id  = env.register_contract(None, crate::PoolContract);

    (env, admin, user1, token_id, pool_id)
}

#[test]
fn test_pool_info_initial() {
    let env = Env::default();
    env.mock_all_auths();

    let admin    = Address::generate(&env);
    let token    = Address::generate(&env);
    let strategy = Address::generate(&env);
    let pool_id  = env.register_contract(None, PoolContract);
    let client   = PoolContractClient::new(&env, &pool_id);

    client.initialize(
        &admin,
        &token,
        &strategy,
        &String::from_str(&env, "Test Pool"),
        &50_u32,
    );

    let info = client.get_pool_info();
    assert_eq!(info.total_shares, 0);
    assert_eq!(info.total_value, 0);
    assert_eq!(info.nav_per_share, 1_000_000); // 1.0 scaled
    assert_eq!(info.fee_bps, 50);
}

#[test]
fn test_user_position_empty() {
    let env = Env::default();
    env.mock_all_auths();

    let admin    = Address::generate(&env);
    let token    = Address::generate(&env);
    let strategy = Address::generate(&env);
    let user     = Address::generate(&env);
    let pool_id  = env.register_contract(None, PoolContract);
    let client   = PoolContractClient::new(&env, &pool_id);

    client.initialize(
        &admin,
        &token,
        &strategy,
        &String::from_str(&env, "Test Pool"),
        &50_u32,
    );

    let pos = client.get_user_position(&user);
    assert_eq!(pos.shares, 0);
    assert_eq!(pos.deposited_value, 0);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialize_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin    = Address::generate(&env);
    let token    = Address::generate(&env);
    let strategy = Address::generate(&env);
    let pool_id  = env.register_contract(None, PoolContract);
    let client   = PoolContractClient::new(&env, &pool_id);

    client.initialize(&admin, &token, &strategy, &String::from_str(&env, "Pool"), &50_u32);
    client.initialize(&admin, &token, &strategy, &String::from_str(&env, "Pool"), &50_u32);
}
