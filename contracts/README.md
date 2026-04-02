# xStream Markets — smart contracts

Foundry project for **xStream**: vault splitting of xStocks into **DividendToken (dx)** and **PrincipalToken (px)**, **PythAdapter** pricing, **MarketKeeper** session logic, **XStreamExchange**, and related tests.

## Layout

| Path | Role |
|------|------|
| `src/XStreamVault.sol` | Deposit xStock, mint dx + px, dividend sync, recombination |
| `src/XStreamExchange.sol` | Exchange / trading logic for px |
| `src/PythAdapter.sol` | Oracle normalization for Pyth |
| `src/MarketKeeper.sol` | Market open / close coordination |
| `src/tokens/DividendToken.sol` | dx ERC-20 |
| `src/tokens/PrincipalToken.sol` | px ERC-20 |
| `src/tokens/LPToken.sol` | LP token |
| `src/DxLeaseEscrow.sol` | Escrow helper |
| `test/` | Forge tests (vault, exchange, Pyth, dividends, sessions, etc.) |
| `script/LifecycleTest.s.sol` | Lifecycle script |

Solidity **0.8.28**, `via_ir = true`. RPC aliases in `foundry.toml` include `anvil`, `ink`, `ink_sepolia`.

## Dependencies

If `lib/` is empty, install remapped deps from the repo root:

```shell
cd contracts
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install pyth-network/pyth-sdk-solidity --no-commit
```

(`--no-commit` skips a git submodule commit; adjust if you use submodules.)

## Commands

Build:

```shell
forge build
```

Test:

```shell
forge test
```

Format:

```shell
forge fmt
```

Gas snapshots:

```shell
forge snapshot
```

Local node:

```shell
anvil
```

Lifecycle integration script (see file header for full notes; typically `anvil` in one terminal, then):

```shell
forge script script/LifecycleTest.s.sol:LifecycleTest --rpc-url anvil --broadcast -vvvv
```

Cast:

```shell
cast <subcommand>
```

## Foundry reference

Full toolkit docs: [https://book.getfoundry.sh/](https://book.getfoundry.sh/)
