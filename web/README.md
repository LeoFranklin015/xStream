# xStream Markets — web

Next.js 16 (App Router) frontend for the xStream protocol: vault, markets, portfolio, and onboarding.

## Setup

```bash
pnpm install
```

## Develop

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build and lint

```bash
pnpm build
pnpm lint
```

## Environment variables

Create `.env.local` in this directory:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata (optional) |

## Stack

React 19, TypeScript, Tailwind CSS, viem, Privy, Pyth Hermes client, Supabase, Framer Motion, Recharts, Lightweight Charts.

See the [repository root README](../README.md) for protocol overview and contract layout.
