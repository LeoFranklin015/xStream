# xStream

Monorepo for **xStream Markets** -- a DeFi protocol that splits tokenized equities (xStocks) into independent **dividend (dx)** and **principal (px)** tokens, giving income investors and session traders each exactly what they want.

> Tokenized equities bundle price and yield into one instrument -- forcing income investors to absorb volatility they don't want, and traders to pay for dividends they'll never use. xStream separates them.

## What it does

- **Vault** -- Deposit any registered xStock; receive equal amounts of dx (dividend rights) and px (price exposure). Burn dx + px in equal amounts to redeem the underlying at any time.

- **Dividends** -- All rebase-driven yield flows exclusively to dx holders via a gas-efficient accumulator. px holders receive zero dividend exposure.

- **Exchange** -- px powers a session-gated leveraged exchange: long or short with USDC collateral, open only during NYSE hours. Positions settle at market close.

- **Auction** -- dx holders can auction their dividend stream for a fixed term (DxLeaseEscrow). The highest USDC bidder leases the income rights; the seller receives upfront yield.

- **Frontend** -- Next.js app: vault, markets, auction, portfolio. Wallet auth via Privy.

## Who it is for

**Long-term holders** keep the dividends, sell or lease the price exposure, and earn yield on yield they were already leaving on the table.

**Session traders** get clean leverage with no dividend drag -- pay only for NYSE hours, nothing more.

**The market** gets primitives that don't exist anywhere else: equity income as a standalone asset, session-gated leverage, and auctionable dividend streams.

## Deployments

| Network | Type | Vault | Exchange | Escrow |
|---------|------|-------|----------|--------|
| Ink Sepolia (763373) | Prod | `0x9e35DE19e3D7DB531C42fFc91Cc3a6F5Ba30B610` | `0x924eb79Bb78981Afa209E45aB3E50ee9d77D1D0F` | `0xC18288E58B79fAac72811dC1456515A88147e85a` |
| Ink Sepolia (763373) | Mock | `0xF0391bEACCA59d2a1A4A339af88dCDeAe210e6B6` | `0x859305A541536B1A2A3BFcaE05244DEAfdB1E167` | `0x662dc3B17696A688efd297D9DF5eFa4B21B607fB` |
| Eth Sepolia (11155111) | Prod | `0xb9DA59D8A25B15DFB6f7A02EB277ADCC34d8B5a8` | `0xEaB336258044846C5b9523967081BDC078C064d6` | `0xC1481eE1f92053A778B6712d6F46e3BeaB339FD7` |
| Eth Sepolia (11155111) | Mock | `0xE7e63166543CEAE1d389e38f8b3faee8129cAfC2` | `0xDbfA9BBdfAb52DCB453105D70c5991d3D1C0E34D` | `0xb2131C8384599d95d2Cdd7733529Bfd7B3c68375` |

Full asset-level addresses (pxToken, dxToken, lpToken per asset) are in `contracts/deployments/`.

Prod deployments use real Dinari xStock tokens (TSLA, NVDA, GOOGL, AAPL, SPY, TBLL, GLD, SLV) and the live oracle at `0x2880aB155794e7179c9eE2e38200202908C17B43`.

## Repository layout

| Path | Description |
|------|-------------|
| `web/` | Next.js 16 app (App Router, React 19) |
| `contracts/` | Foundry project: `XStreamVault`, `XStreamExchange`, `MarketKeeper`, `DxLeaseEscrow`, `PythAdapter`, token contracts, tests |
| `contracts/deployments/` | JSON deployment artifacts for all 4 deployments |
| `contracts/script/` | `MockDeploy.s.sol`, `ProdDeploy.s.sol`, `NetworkRegistry.sol` |
| `PRD.md` | Product requirements: architecture, personas, phased rollout, risks |
| `web/INTEGRATION_GUIDE.md` | Frontend integration guide: ABI usage, contract calls per page, Pyth update data |

## Tech stack

**Web:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, viem, Privy, Framer Motion, Supabase, Recharts, Lightweight Charts.

**Contracts:** Solidity 0.8.28, Foundry, OpenZeppelin, Pyth SDK, `via_ir = true`.

## Prerequisites

- [Node.js](https://nodejs.org/) LTS
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## Web app

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run lint
```

### Environment variables

Create `web/.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata (optional; falls back to `VERCEL_URL` on Vercel) |

## Smart contracts

```bash
cd contracts
forge build
forge test
```

Deploy mock (any network):

```bash
forge script script/MockDeploy.s.sol:MockDeploy --rpc-url <network> --broadcast
```

Deploy prod (Ink Sepolia or Eth Sepolia):

```bash
forge script script/ProdDeploy.s.sol:ProdDeploy --rpc-url ink_sepolia --broadcast
```

Requires `PRIVATE_KEY` in `contracts/.env`.

## Documentation

- **[PRD.md](./PRD.md)** -- Problem statement, contract architecture, functional requirements, personas, roadmap.
- **[web/INTEGRATION_GUIDE.md](./web/INTEGRATION_GUIDE.md)** -- Complete frontend integration guide: addresses, ABIs, Pyth update data, per-page contract call reference.

## Disclaimer

Smart contracts are experimental and unaudited. Use at your own risk. This repository does not constitute financial or legal advice.
