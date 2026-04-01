# xStream — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Last updated:** April 1, 2026  
**Author:** xStream Core Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [Users and Personas](#4-users-and-personas)
5. [Product Architecture Overview](#5-product-architecture-overview)
6. [Functional Requirements](#6-functional-requirements)
   - 6.1 [Vault — Token Splitting](#61-vault--token-splitting)
   - 6.2 [Dividend Token (dx) Market](#62-dividend-token-dx-market)
   - 6.3 [Principal Token (px) Exchange](#63-principal-token-px-exchange)
   - 6.4 [Oracle Integration](#64-oracle-integration)
   - 6.5 [Market Session Management](#65-market-session-management)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Smart Contract Specifications](#8-smart-contract-specifications)
9. [Token Economics](#9-token-economics)
10. [Project Lifecycle](#10-project-lifecycle)
    - 10.1 [Phase 0 — Foundation](#101-phase-0--foundation)
    - 10.2 [Phase 1 — Core Protocol](#102-phase-1--core-protocol)
    - 10.3 [Phase 2 — Exchange Layer](#103-phase-2--exchange-layer)
    - 10.4 [Phase 3 — Multi-Asset Expansion](#104-phase-3--multi-asset-expansion)
    - 10.5 [Phase 4 — Testnet Launch](#105-phase-4--testnet-launch)
    - 10.6 [Phase 5 — Audit and Security](#106-phase-5--audit-and-security)
    - 10.7 [Phase 6 — Mainnet Launch](#107-phase-6--mainnet-launch)
    - 10.8 [Phase 7 — Post-Launch Iteration](#108-phase-7--post-launch-iteration)
11. [Milestones and Timeline](#11-milestones-and-timeline)
12. [Risk Register](#12-risk-register)
13. [Success Metrics](#13-success-metrics)
14. [Open Questions](#14-open-questions)

---

## 1. Executive Summary

xStream is a DeFi protocol that splits tokenized real-world equity ETFs (xStocks) into two fully independent, tradeable instruments: a **dividend token (dx)** representing yield rights, and a **principal token (px)** representing pure price exposure.

Each token has its own valid market. The dx token trades on a 24/7 income market priced against its dividend schedule. The px token powers a leveraged day-trading exchange that opens and closes with NYSE market hours, using Pyth Network for real-time price feeds.

The system targets three initial assets: **AAPL, ABT, and SPY** xStock tokens, with an architecture designed to support arbitrary ERC20 xStock additions through a single registry call.

---

## 2. Problem Statement

Existing tokenized equity products (xStocks) bundle price exposure and dividend yield into one instrument. This creates friction for two classes of users who want fundamentally different things:

- **Income investors** want yield with minimal price risk. Holding a full xStock forces them to absorb price volatility they do not want.
- **Day traders** want clean price exposure. Holding a full xStock means implicitly paying for dividend yield on every position — even intraday positions held for minutes — creating an inefficiency they cannot opt out of.

No DeFi protocol today separates these two components into independently tradeable instruments with dedicated, purpose-built markets.

---

## 3. Goals and Non-Goals

### Goals

- Split any registered xStock ERC20 into a dx (dividend) token and px (principal) token via a single vault contract.
- Route 100% of dividend rebases exclusively to dx holders using a gas-efficient accumulator pattern.
- Build a 24/7 secondary market for dx tokens priced against the known dividend schedule.
- Build a market-hours-gated leveraged trading exchange for px tokens backed by USDC liquidity.
- Support AAPL, ABT, and SPY at launch. Support arbitrary xStock addition post-launch.
- Use Pyth Network as the sole price oracle for all exchange operations.
- Provide a recombination mechanism (burn dx + px → redeem xStock) to maintain arbitrage efficiency.

### Non-Goals

- Building a frontend wallet or custodial interface (v1 is protocol-only).
- Supporting non-xStock ERC20s (e.g. raw AAPL stock, CEX tokens).
- Implementing governance token mechanics in v1.
- Providing fiat on-ramps or off-ramps.
- Cross-chain deployment in v1 (single chain: Base).
- Perpetual positions — all px positions settle daily at market close.

---

## 4. Users and Personas

### Alice — Income Investor

**Goal:** Earn predictable dividend yield without taking on equity price risk.

**Behavior:** Buys dx tokens on the secondary market at a discount before dividend events. Holds until rebase. Claims yield. Reinvests into the next cycle. Never touches px tokens.

**Pain point today:** Forced to hold full xStock and absorb price volatility to access yield.

### Bob — Day Trader

**Goal:** Clean leveraged price exposure to AAPL or SPY intraday, with no forced exposure to dividend mechanics.

**Behavior:** Opens long or short px positions at market open. Closes by end of session. Never wants to think about dividends. Uses USDC as collateral.

**Pain point today:** No DeFi instrument gives clean, no-dividend leveraged equity exposure. Perpetuals carry overnight funding rates. Holding xStock includes yield drag.

### Carol — Yield Stripper / Staker

**Goal:** Acquire dividend rights cheaply by splitting xStock and selling px on the secondary market.

**Behavior:** Deposits xStock into vault. Receives dx + px. Immediately sells px at market for USDC. Holds dx for dividend income at a cost basis below face value.

**Pain point today:** No mechanism to separate yield from price exposure in DeFi equity products.

### Dave — Arbitrageur

**Goal:** Capture spread between xStock price and (dx + px) combined price.

**Behavior:** Monitors vault. When dx + px < xStock: buys both, recombines, sells xStock. When dx + px > xStock: buys xStock, splits, sells both. Keeps system price-efficient.

**Pain point today:** No such arbitrage opportunity exists because no protocol creates this split.

### Eve — Liquidity Provider

**Goal:** Earn trading fees by providing USDC liquidity to the px exchange.

**Behavior:** Deposits USDC into a specific asset pool. Earns 0.05% of every trade notional. Absorbs trader profits on winning longs; collects collateral from losing positions.

---

## 5. Product Architecture Overview

xStream consists of four contract layers deployed on Base mainnet:

```
┌─────────────────────────────────────────────────────────────────┐
│                        User / Trader                            │
└───────────────────────┬────────────────────────────────────────┘
                        │
         ┌──────────────┴───────────────┐
         ▼                              ▼
┌──────────────────┐          ┌──────────────────────┐
│  XStreamVault    │          │  XStreamExchange      │
│                  │          │                        │
│  deposit()       │          │  openLong()            │
│  withdraw()      │          │  openShort()           │
│  claimDividend() │          │  closeLong()           │
│  syncDividend()  │          │  closeShort()          │
└────────┬─────────┘          │  liquidate()           │
         │                    └──────────┬─────────────┘
         │                               │
    ┌────┴────┐                    ┌─────┴──────┐
    ▼         ▼                    ▼            ▼
  AAPLpx   AAPLdx            USDC LP Pool   px Reserve
  (ERC20)  (ERC20)           (LPToken)      (px inventory)
         │                               │
         └─────────────┬─────────────────┘
                       ▼
            ┌──────────────────┐    ┌──────────────────┐
            │  PythAdapter     │    │  MarketKeeper     │
            │                  │    │                   │
            │  getPrice()      │    │  openMarket()     │
            │  normalizePyth() │    │  closeMarket()    │
            └──────────────────┘    └──────────────────┘
```

**Key design invariant:** `totalDeposited[xStock]` in the vault must always equal the sum of all user principal shares. The dividend reserve accumulates separately from the principal pool. These two pools must never be confused.

---

## 6. Functional Requirements

### 6.1 Vault — Token Splitting

| ID | Requirement | Priority |
|----|-------------|----------|
| V-01 | Vault accepts any registered xStock and mints equal amounts of px and dx to the depositor | P0 |
| V-02 | Vault detects dividend rebase events by comparing current `xStock.multiplier()` to its stored `lastMultiplier` snapshot | P0 |
| V-03 | 100% of dividend delta is attributed to dx holders via a Masterchef-style `accDivPerShare` accumulator (1e36 precision) | P0 |
| V-04 | px holders receive zero dividend attribution — their balance is unaffected by rebase events | P0 |
| V-05 | `claimDividend()` transfers pending xStock to caller with O(1) gas cost regardless of holder count | P0 |
| V-06 | Dividend claims are auto-triggered before every deposit and withdraw to prevent stale debt | P0 |
| V-07 | Recombination: burning equal amounts of px + dx returns the underlying xStock plus any unclaimed dividend | P0 |
| V-08 | DividendToken `_beforeTokenTransfer` hook auto-claims dividends for both sender and receiver on every secondary transfer, then re-anchors rewardDebt | P0 |
| V-09 | `syncDividend()` is callable publicly (not just internally) to allow keepers to sync without a user action | P1 |
| V-10 | Vault supports a configurable `minDepositAmount` per asset to prevent dust accumulation | P1 |
| V-11 | Vault is pausable by owner — pause blocks deposit/withdraw but not claims | P1 |
| V-12 | `getAssetConfig()` returns full AssetConfig struct for any registered xStock | P2 |

### 6.2 Dividend Token (dx) Market

| ID | Requirement | Priority |
|----|-------------|----------|
| D-01 | dx tokens are freely transferable ERC20s — they can be listed on any DEX or secondary market | P0 |
| D-02 | dx price on secondary market is naturally anchored by the next expected dividend event and the recombination arbitrage floor | P0 |
| D-03 | dx holders accrue yield pro-rata to their balance at the time of each sync event — latecomers do not receive retroactive yield | P0 |
| D-04 | The dividend claim is denominated in xStock (not USDC) — claimants receive the rebased token directly | P0 |
| D-05 | A read-only `pendingDividend(xStock, user)` view returns claimable amount without gas cost | P1 |

### 6.3 Principal Token (px) Exchange

| ID | Requirement | Priority |
|----|-------------|----------|
| E-01 | Exchange accepts USDC collateral for both long and short positions on any registered px token | P0 |
| E-02 | Maximum leverage is 5x by default, configurable per pool by owner | P0 |
| E-03 | Long positions: profit paid from USDC LP pool; loss deducted from collateral | P0 |
| E-04 | Short positions: exchange pulls px from its reserve at open; returns px at close; USDC difference settles profit/loss | P0 |
| E-05 | Positions cannot be opened when `MarketKeeper.isMarketOpen()` returns false | P0 |
| E-06 | Positions can be closed and liquidated at any time, including outside market hours | P0 |
| E-07 | `settleAllPositions()` is callable only by the keeper, force-closes all open positions at the closing oracle price | P0 |
| E-08 | Liquidation fires when `healthFactor < 0.2` (loss exceeds 80% of collateral). Liquidator receives 10% of remaining collateral. | P0 |
| E-09 | Opening fee of 0.05% of notional is deducted from collateral at position open. Fee flows to LP pool. | P0 |
| E-10 | px reserve can be seeded by external LPs who receive reserve share tokens and earn 0.025% per short notional | P1 |
| E-11 | LP withdrawal is blocked if the pool would fall below the minimum reserve required to cover all open positions | P1 |
| E-12 | `getUnrealizedPnl()` returns current PnL, current price, and liquidation status for any position | P1 |

### 6.4 Oracle Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| O-01 | All price reads use Pyth Network's pull oracle model — callers must supply a signed VAA from Hermes in every price-sensitive transaction | P0 |
| O-02 | PythAdapter normalizes all prices to 1e18 units regardless of Pyth's native exponent | P0 |
| O-03 | Price attestations older than `maxStaleness` (default: 60 seconds) are rejected with `StalePrice()` revert | P0 |
| O-04 | `getUpdateFee()` is exposed as a view so the frontend can correctly set `msg.value` before submitting price-sensitive transactions | P0 |
| O-05 | `maxStaleness` is configurable by owner — can be tightened to 30s during high-volatility sessions | P1 |
| O-06 | `getPriceCached()` provides a gas-free read for frontend display using Pyth's internal cache | P2 |

### 6.5 Market Session Management

| ID | Requirement | Priority |
|----|-------------|----------|
| K-01 | `openMarket()` is callable only by authorized keeper addresses | P0 |
| K-02 | `closeMarket()` accepts batch Pyth update data for all registered assets and triggers `settleAllPositions()` on each pool | P0 |
| K-03 | `emergencyCloseMarket()` halts new positions without force-settling existing ones — for use when oracle is unavailable | P0 |
| K-04 | Multiple keeper addresses can be authorized — supports Chainlink Automation, Gelato, or a custom bot | P1 |
| K-05 | `addKeeper()` and `removeKeeper()` are restricted to the contract owner (multisig) | P0 |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Gas efficiency** | Dividend claims must be O(1) — no iteration over holders. Accumulator pattern required. |
| **Precision** | Use 1e36 precision for `accDivPerShare` to prevent rounding loss on claims for small balances. |
| **Security** | No reentrancy vectors. Use `ReentrancyGuard` on all state-changing vault and exchange functions. |
| **Upgradeability** | v1 is non-upgradeable. Immutable logic with owner-configurable parameters only. |
| **Chain** | Base mainnet (EVM-compatible, low gas, Pyth supported). |
| **Solidity version** | 0.8.24 minimum (custom error support, overflow checks built-in). |
| **Test coverage** | 100% line coverage on vault dividend accumulator. 95%+ on exchange settlement logic. |
| **Audit** | Full audit by one tier-1 firm before mainnet launch. |
| **Max positions per pool** | Bounded at 500 open positions per pool to prevent unbounded gas in `settleAllPositions()`. |
| **Keeper latency** | Market open/close must execute within 5 minutes of NYSE open/close time. |

---

## 8. Smart Contract Specifications

### Contract Inventory

| Contract | Role | Deployments |
|----------|------|-------------|
| `XStreamVault` | Core vault. Splits/recombines xStock. Routes dividends. | 1 (all assets) |
| `PrincipalToken` | ERC20 px token. Price-only. No rebase. | 1 per asset |
| `DividendToken` | ERC20 dx token. Transfer hook for yield-theft prevention. | 1 per asset |
| `XStreamExchange` | Leveraged long/short px trading. USDC-settled. | 1 (all pools) |
| `LPToken` | LP share for exchange USDC pool. Non-transferable v1. | 1 per pool |
| `PythAdapter` | Wraps Pyth. Normalizes to 1e18. Enforces staleness. | 1 |
| `MarketKeeper` | Opens/closes market sessions. Manages keeper authorization. | 1 |

### Storage Layout — XStreamVault

```solidity
struct AssetConfig {
    address principalToken;   // AAPLpx
    address dividendToken;    // AAPLdx
    bytes32 pythFeedId;       // Pyth price feed
    uint256 lastMultiplier;   // xStock multiplier at last sync (1e18)
    uint256 accDivPerShare;   // Cumulative dividend accumulator (1e36)
    uint256 totalDeposited;   // Raw xStock units in vault
}

mapping(address xStock => AssetConfig) public assets;
mapping(address xStock => mapping(address user => uint256)) public rewardDebt;
mapping(address xStock => uint256) public minDepositAmount;
```

### Storage Layout — XStreamExchange

```solidity
struct Position {
    address trader;
    address pxToken;
    bool isLong;
    uint256 size;        // px units (1e18)
    uint256 entryPrice;  // USDC/px (1e18)
    uint256 collateral;  // USDC (6 dec), net of opening fee
    uint256 leverage;    // 1e18-scaled
    uint256 openedAt;    // block.timestamp
}

struct PoolConfig {
    address xStock;
    bytes32 pythFeedId;
    uint256 usdcLiquidity;
    uint256 pxReserve;
    uint256 totalFees;
    uint256 openInterestLong;
    uint256 openInterestShort;
}

mapping(bytes32 positionId => Position) public positions;
mapping(address pxToken => PoolConfig) public pools;
mapping(address pxToken => bytes32[]) public openPositionIds;
mapping(address pxToken => uint256) public maxLeverage;
```

---

## 9. Token Economics

### Fee Structure

| Fee | Amount | Recipient |
|-----|--------|-----------|
| Trade opening fee | 0.05% of notional | USDC LP pool |
| Short reserve fee | 0.025% of short notional | px reserve providers |
| Liquidation reward | 10% of remaining collateral | Liquidation caller (keeper) |
| Liquidation residual | 90% of remaining collateral | USDC LP pool |

### Projected dx APY (SPY, 30% daily utilization at 0.05% fee)

| Source | Annual contribution |
|--------|-------------------|
| SPY base dividend | ~1.3% |
| px trading session fees | ~10–15% |
| **Total estimated dx APY** | **~12–16%** |

> Note: Trading fee contribution scales with exchange utilization. 30% daily utilization is a conservative assumption for an established pool. This APY is not guaranteed and will fluctuate.

### Recombination Arbitrage Bounds

The recombination mechanism creates hard price bounds:

- **Floor:** If `price(dx) + price(px) < price(xStock)` → arbitrageurs buy both, recombine, profit
- **Ceiling:** If `price(dx) + price(px) > price(xStock)` → arbitrageurs split xStock, sell both, profit

No oracle is needed for this bound — it is enforced by the vault's deterministic mint/burn math.

---

## 10. Project Lifecycle

### 10.1 Phase 0 — Foundation

**Duration:** Week 1  
**Goal:** Establish development infrastructure, finalize architecture decisions, deploy base tooling.

#### Deliverables

- [ ] Hardhat or Foundry project initialized with Solidity 0.8.24
- [ ] `.env` template with Base testnet RPC, Pyth Hermes API key, deployer key
- [ ] `IXStock.sol` interface confirmed against actual xStock ERC20 deployed addresses
- [ ] Mock xStock ERC20 deployed on Base Sepolia with callable `setMultiplier()`
- [ ] Pyth contract address confirmed for Base Sepolia testnet
- [ ] Feed IDs confirmed for AAPL, ABT, SPY from Pyth price feed catalog
- [ ] CI pipeline: lint (Solhint) + compile + test on every push
- [ ] Architecture decision record: dividend accrual model confirmed as Masterchef accumulator
- [ ] Architecture decision record: dx tokens are perpetual accrual (not fixed-expiry) for v1

#### Exit Criteria

All environment variables populated. Mock xStock multiplier changes are reflected in `balanceOf()`. Pyth feed IDs return valid prices from Hermes on testnet.

---

### 10.2 Phase 1 — Core Protocol

**Duration:** Weeks 2–3  
**Goal:** Vault contract fully functional with correct dividend routing.

#### Deliverables

- [ ] `PrincipalToken.sol` — minimal ERC20, `onlyVault` mint/burn
- [ ] `DividendToken.sol` — ERC20 with `_beforeTokenTransfer` hook calling vault claim + debt reset
- [ ] `XStreamVault.sol` — `registerAsset()`, `deposit()`, `withdraw()`, `claimDividend()`, `syncDividend()`
- [ ] Accumulator math verified: `pending = balance * accDivPerShare / 1e36 - rewardDebt`
- [ ] Invariant test: `totalDeposited` always equals sum of outstanding px supply
- [ ] Invariant test: vault xStock balance always equals `totalDeposited + dividendReserve`
- [ ] Fuzz test: random multiplier changes never allow claim amount to exceed vault balance
- [ ] Unit test: dx transfer hook prevents retroactive yield claim by buyer
- [ ] Unit test: withdraw auto-claims dividend before burning tokens
- [ ] Gas benchmark: `claimDividend()` < 80,000 gas regardless of holder count

#### Exit Criteria

All unit and fuzz tests pass. Dividend accumulator is mathematically verified by at least two team members reviewing the arithmetic independently. Gas benchmarks met.

---

### 10.3 Phase 2 — Exchange Layer

**Duration:** Weeks 4–5  
**Goal:** Leveraged px trading exchange with USDC LP pool, shorts, and forced settlement.

#### Deliverables

- [ ] `LPToken.sol` — non-transferable ERC20, `onlyExchange` mint/burn
- [ ] `PythAdapter.sol` — `getPrice()`, `getPriceCached()`, `normalizePythPrice()`, `getUpdateFee()`
- [ ] `MarketKeeper.sol` — `openMarket()`, `closeMarket()`, `emergencyCloseMarket()`, keeper auth
- [ ] `XStreamExchange.sol` — `registerPool()`, `depositLiquidity()`, `withdrawLiquidity()`, `depositPxReserve()`
- [ ] `openLong()` / `closeLong()` with Pyth price integration and USDC LP settlement
- [ ] `openShort()` / `closeShort()` with px reserve draw and USDC settlement
- [ ] `liquidate()` with health factor check and 10% keeper reward
- [ ] `settleAllPositions()` callable by keeper only, iterates bounded position list
- [ ] `marketOpen` modifier on `openLong` / `openShort`
- [ ] Pyth update fee forwarding from `msg.value` to Pyth contract
- [ ] Unit test: long profit paid from LP pool, long loss deducted from collateral
- [ ] Unit test: short profit from price fall, short loss from price rise
- [ ] Unit test: liquidation at correct health factor threshold
- [ ] Unit test: `settleAllPositions()` clears all open positions at closing price
- [ ] Integration test: full Alice journey (deposit → sell px → hold dx → claim)
- [ ] Integration test: full Bob journey (open long → price moves → close → receive USDC)
- [ ] Integration test: full Carol journey (deposit → sell px → hold dx → claim yield)

#### Exit Criteria

All integration journeys pass end-to-end on a forked Base Sepolia. Pyth price feeds return non-zero values. No reentrancy vectors identified in manual review.

---

### 10.4 Phase 3 — Multi-Asset Expansion

**Duration:** Week 6  
**Goal:** Register AAPL, ABT, and SPY as distinct assets. Verify no state bleed between pools.

#### Deliverables

- [ ] `XStreamVault.registerAsset()` called for xAAPL, xABT, xSPY
- [ ] `XStreamExchange.registerPool()` called for AAPLpx, ABTpx, SPYpx
- [ ] Per-pool `maxLeverage` configured: SPY = 3x, AAPL = 5x, ABT = 5x
- [ ] Pyth feed IDs verified for all three assets on Base mainnet
- [ ] Invariant test: dividend sync on AAPL does not affect ABT or SPY accumulators
- [ ] Invariant test: liquidating an AAPL position does not affect SPY LP pool
- [ ] Fuzz test: random mix of AAPL/ABT/SPY deposits and trades do not corrupt any pool

#### Exit Criteria

Three assets independently registered and tested. No cross-contamination between pools detected in any test scenario.

---

### 10.5 Phase 4 — Testnet Launch

**Duration:** Week 7  
**Goal:** Deploy full system to Base Sepolia. Run keeper bot. Conduct internal beta.

#### Deliverables

- [ ] Full system deployed to Base Sepolia with verified contract addresses
- [ ] Keeper bot deployed (Node.js + ethers.js) with cron jobs for 9:30 AM / 4:00 PM EST
- [ ] Keeper bot Hermes integration: fetches batch VAA for all three assets on each session close
- [ ] Keeper wallet funded with ETH for Pyth update fees
- [ ] Internal team runs all four user journeys (Alice, Bob, Carol, Dave)
- [ ] Frontend dashboard (minimal): show px price, dx APY estimate, open positions, unclaimed dividends
- [ ] Bug tracking opened for all issues found in internal beta
- [ ] Testnet contract addresses documented in repo README
- [ ] Deployment scripts idempotent: re-running does not re-deploy already-deployed contracts

#### Exit Criteria

All four user journeys complete end-to-end on testnet without manual intervention. Keeper bot runs for 5 consecutive trading sessions without failure. No P0 bugs open.

---

### 10.6 Phase 5 — Audit and Security

**Duration:** Weeks 8–10  
**Goal:** Third-party audit, internal security review, bug fixes.

#### Deliverables

- [ ] Audit firm engaged (target: Trail of Bits, Spearbit, or Sherlock)
- [ ] Audit scope document submitted: all 7 contracts, focus on accumulator math and reentrancy
- [ ] Internal security checklist completed:
  - [ ] All external calls are to known, trusted contracts only
  - [ ] No unchecked arithmetic
  - [ ] All state changes precede external calls (CEI pattern)
  - [ ] `ReentrancyGuard` on all vault and exchange state-changing functions
  - [ ] Pyth fee forwarding does not leave ETH trapped in contracts
  - [ ] Emergency pause covers all critical paths
  - [ ] `setMultiplier` cannot be called by anyone except the xStock issuer (not a concern for our contracts — documented)
- [ ] Audit report received
- [ ] All Critical and High findings remediated
- [ ] Medium findings reviewed — each either remediated or explicitly accepted with rationale
- [ ] Re-audit of remediated findings (if auditor requires)
- [ ] Final audit report published

#### Exit Criteria

No open Critical or High audit findings. All Medium findings have a documented disposition. Audit report is publicly available.

---

### 10.7 Phase 6 — Mainnet Launch

**Duration:** Week 11  
**Goal:** Deploy audited contracts to Base mainnet. Seed initial liquidity. Open to public.

#### Deliverables

- [ ] Mainnet deployment checklist completed:
  - [ ] Pyth contract address verified for Base mainnet
  - [ ] All feed IDs verified against Pyth mainnet catalog
  - [ ] Owner multisig address confirmed (Gnosis Safe, 3-of-5)
  - [ ] Keeper bot address funded and authorized
  - [ ] `minDepositAmount` set per asset
  - [ ] `maxLeverage` set per pool
  - [ ] `maxStaleness` set to 60s
- [ ] Contracts deployed and verified on Basescan
- [ ] Initial USDC liquidity seeded into each pool (minimum $50,000 per pool for launch)
- [ ] Initial px reserve seeded for short positions on each pool (minimum 100 px tokens per pool)
- [ ] Keeper bot running on mainnet — confirmed open/close of first trading session
- [ ] Public announcement with contract addresses, audit report link, documentation
- [ ] Bug bounty program live on Immunefi or Code4rena

#### Exit Criteria

First mainnet trading session completes without errors. At least one long position and one short position opened and closed on each asset. Keeper settles all positions at 4:00 PM EST.

---

### 10.8 Phase 7 — Post-Launch Iteration

**Duration:** Ongoing from Week 12  
**Goal:** Monitor, optimize, and expand based on real usage data.

#### Deliverables (Planned)

- [ ] **v1.1 — Fixed-expiry dx tokens:** Implement quarterly maturity model for dx. Enables cleaner income market pricing. Requires new DividendToken implementation and migration plan.
- [ ] **v1.2 — Chainlink Automation integration:** Replace manual keeper bot with decentralized Chainlink Automation for open/close reliability. Remove single point of failure.
- [ ] **v1.3 — Additional assets:** Register xTSLA, xNVDA, xMSFT based on user demand data.
- [ ] **v1.4 — Intraday partial settlement:** Allow traders to partially close positions rather than full close only.
- [ ] **v2.0 — Transferable LP tokens:** Enable LP share trading on secondary market. Requires reward-debt tracking for LP transfers (analogous to dx transfer hook).

---

## 11. Milestones and Timeline

| Milestone | Target Date | Phase |
|-----------|-------------|-------|
| Infrastructure ready, mock xStock on testnet | Week 1 end | Phase 0 |
| Vault dividend accumulator fully tested | Week 3 end | Phase 1 |
| Exchange long/short/liquidation live on fork | Week 5 end | Phase 2 |
| All three assets registered, cross-pool isolation verified | Week 6 end | Phase 3 |
| Full system on Base Sepolia, keeper running | Week 7 end | Phase 4 |
| Audit report received | Week 9 end | Phase 5 |
| All audit findings resolved | Week 10 end | Phase 5 |
| Mainnet deployment and first session settled | Week 11 end | Phase 6 |
| v1.1 fixed-expiry dx design complete | Week 16 | Phase 7 |

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| xStock multiplier is not exposed as `multiplier()` — different function signature | Medium | High | Confirm interface with xStock issuer in Phase 0. Build adapter pattern if needed. |
| Pyth feed for AAPL/ABT/SPY unavailable on Base mainnet | Low | Critical | Verify feed catalog before Phase 6. Fallback: request Pyth team add feeds. |
| Keeper bot fails to call `closeMarket()` — positions remain open overnight | Medium | High | `emergencyCloseMarket()` available. Keeper redundancy (two bots, different providers). Alerting on missed session close. |
| Accumulator precision loss on very small deposits | Low | Medium | 1e36 accumulator precision. `minDepositAmount` prevents dust. Fuzz tests with extreme values. |
| LP pool insolvency if many traders win simultaneously | Low | High | Pool utilization cap: LPs can only withdraw down to `openInterest + buffer`. Fee income builds reserves over time. |
| Oracle sandwich attack around Pyth update | Medium | High | Pyth's pull model significantly mitigates this vs push oracles. Staleness check (60s) limits window. |
| Short px reserve exhausted — no px available for new shorts | Medium | Medium | `depositPxReserve()` allows any px holder to add inventory. Vault can lend idle px. |
| Audit finds critical vulnerability requiring full rewrite | Low | Critical | Phase 5 allocated 3 weeks. Audit firm engaged early. Internal review in Phase 3–4 to catch issues pre-audit. |
| Regulatory action against tokenized equity products | Low | Critical | Not in scope for this PRD. Protocol is non-custodial. Legal review recommended pre-launch. |

---

## 13. Success Metrics

### 30 Days Post-Launch

| Metric | Target |
|--------|--------|
| Total Value Locked (TVL) | > $500,000 |
| Daily trading volume (px exchange) | > $50,000 |
| Unique traders | > 100 |
| Keeper uptime (sessions opened/closed correctly) | > 99% |
| Dividend claims processed without error | 100% |
| Audit findings reopened post-launch | 0 |

### 90 Days Post-Launch

| Metric | Target |
|--------|--------|
| TVL | > $2,000,000 |
| dx APY (AAPL pool) | > 8% |
| Liquidations processed correctly (no bad debt) | 100% |
| Average session utilization (px positions / max capacity) | > 20% |
| Community-requested asset additions | ≥ 2 new xStocks registered |

---

## 14. Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Does xStock expose `multiplier()` as a public view function, or must we read `balanceOf(vault)` before/after as a proxy? | Backend lead | Phase 0 |
| 2 | What is the exact Pyth price feed ID for ABT on Base? (AAPL and SPY are confirmed.) | Oracle lead | Phase 0 |
| 3 | Should `settleAllPositions()` be gas-bounded per call (batch of N positions) or process all positions in one tx? If >500 positions exist, a single tx may exceed block gas limit. | Smart contract lead | Phase 1 |
| 4 | Should the dx token be non-transferable in v1 to simplify transfer hook accounting? Or is secondary market liquidity for dx a launch requirement? | Product | Phase 0 |
| 5 | Should LPs earn fees on losing trader collateral in addition to trading fees, or only on trading fees? | Economics | Phase 2 |
| 6 | Is there a legal requirement to geofence US users from the px leveraged trading market? | Legal | Phase 5 |
| 7 | Should the keeper bot be run by the team in perpetuity, or should Chainlink Automation be integrated at launch? | Infrastructure | Phase 3 |

---

*This document is a living specification. All sections are subject to revision as development progresses. Major changes require sign-off from the product lead and smart contract lead.*
