# xStream Markets -- web

Next.js 16 (App Router, React 19) frontend for the xStream protocol: vault, markets, auction, portfolio, and onboarding.

## Setup

```bash
npm install
```

## Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build and lint

```bash
npm run build
npm run lint
```

## Environment variables

Create `.env.local` in this directory:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata (optional) |

## Stack

React 19, TypeScript, Tailwind CSS, viem, Privy, Supabase, Framer Motion, Recharts, Lightweight Charts.

## Integration

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for contract addresses, ABIs, Pyth update data, and per-page call reference.

See the [repository root README](../README.md) for protocol overview, deployments, and contract layout.
