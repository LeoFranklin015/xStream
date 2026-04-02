# Xstream

Monorepo for **xStream Markets**: a DeFi protocol and web app that split **tokenized equities (xStocks)** into separate **dividend (dx)** and **principal (px)** tokens so users can trade or hedge **yield versus price**.

## What it does

- **Vault**  
  Deposit a registered xStock; mint matched **dx** (dividend rights) and **px** (price exposure). Recombine by burning dx + px to redeem the underlying.

- **Dividends**  
  Rebase-driven yield is attributed to **dx** holders via a high-precision accumulator so claims stay gas-efficient.

- **Markets**  
  **dx** is a transferable ERC-20 (24/7 income narrative). **px** supports a session-aware, oracle-marked exchange (NYSE-aligned sessions in the product spec) using **Pyth** for prices.

- **Frontend**  
  Next.js app: vault, markets, portfolio, onboarding, and educational UI. Wallet auth via **Privy**; optional **Supabase** for app data.

Target chain in the product requirements is **Base**; smart contracts live under `contracts/` (Solidity + Foundry).

## Repository layout

| Path | Description |
|------|-------------|
| `web/` | Next.js 16 app (App Router, React 19) |
| `contracts/` | Foundry project: `XStreamVault`, `XStreamExchange`, `PythAdapter`, `MarketKeeper`, token contracts, tests |
| `PRD.md` | Product requirements (architecture, personas, phased rollout) |
| `scripts/` | Auxiliary scripts (see `scripts/package.json`) |

## Tech stack

**Web:** Next.js, TypeScript, Tailwind CSS, shadcn/ui patterns, viem, Privy, Pyth Hermes client, Supabase client, Framer Motion, Recharts / Lightweight Charts.

**Contracts:** Solidity 0.8.28, Foundry (Forge), `via_ir = true`.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for `contracts/`)

## Web app

```bash
cd web
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**Build and lint**

```bash
cd web
pnpm build
pnpm lint
```

### Environment variables

Create `web/.env.local` (not committed) with:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata (optional; falls back to `VERCEL_URL` on Vercel) |

## Smart contracts

```bash
cd contracts
forge build
forge test
```

If `contracts/lib/` is missing, run the **Dependencies** steps in `contracts/README.md` (`forge install` for forge-std, OpenZeppelin, Pyth SDK).

See `contracts/README.md` for Foundry usage (snapshot, fmt, lifecycle script).

## Documentation

- **[PRD.md](./PRD.md)** — Problem statement, goals, contract layers, functional requirements, roadmap, risks.

## Disclaimer

Smart contracts and the interface are **experimental**. Using them can result in **total loss of funds**. This repository does not constitute financial or legal advice.

## Contributing

Issues and pull requests are welcome. Match existing style; use **pnpm** in `web/`.
