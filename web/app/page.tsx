"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Vault,
  Split,
  TrendingUp,
  DollarSign,
  BarChart3,
  Clock,
  Zap,
  Layers,
  Target,
  Repeat,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LiquidEther from "@/components/LiquidEther";
import HeroSplitVisual from "@/components/landing/HeroSplitVisual";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const steps = [
  {
    num: "01",
    title: "Deposit xStock",
    desc: "Lock a registered xStock (for example AAPL, ABT, or SPY) in the vault. One deposit, two claims on the same underlying.",
    icon: Vault,
  },
  {
    num: "02",
    title: "Mint dx + px",
    desc: "The vault mints matching dx (dividend rights) and px (principal). Yield accrues to dx; px tracks price for the session-bound exchange.",
    icon: Split,
  },
  {
    num: "03",
    title: "Route to your market",
    desc: "Hold or trade dx against the dividend schedule 24/7. Trade px with USDC collateral when the equity session is open. Recombine to exit.",
    icon: TrendingUp,
  },
];

const personas = [
  {
    icon: DollarSign,
    name: "Alice",
    title: "Income investor",
    desc: "Wants dividend flow without riding every tick of the equity. Buys dx and lets rebases accrue to dx holders, not px.",
  },
  {
    icon: BarChart3,
    name: "Bob",
    title: "Session trader",
    desc: "Wants clean price exposure when the cash market is open, without carrying dividend mechanics on intraday px positions.",
  },
  {
    icon: Layers,
    name: "Carol",
    title: "Yield stripper",
    desc: "Splits xStock, sells px for USDC, keeps dx to capture the dividend stream at a basis shaped by the strip.",
  },
  {
    icon: Repeat,
    name: "Dave",
    title: "Arbitrageur",
    desc: "Watches dx + px versus xStock. Recombines when the bundle is cheap, splits when it is rich, keeping pools aligned.",
  },
];

const stats = [
  { label: "Launch universe", value: "AAPL, ABT, SPY" },
  { label: "dx market", value: "24/7" },
  { label: "px exchange", value: "NYSE hours" },
  { label: "Price oracle", value: "Pyth" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-[#0a0a0a]">
        <div className="pointer-events-none absolute inset-0 z-0">
          <LiquidEther
            colors={["#141414", "#c8ff00", "#3d5200"]}
            resolution={0.45}
            mouseForce={18}
            autoSpeed={0.45}
          />
        </div>
        {/* Legibility: darken behind copy (left), keep ether visible on the right */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_90%_120%_at_0%_40%,#0a0a0a_0%,transparent_55%),radial-gradient(ellipse_at_70%_30%,transparent_20%,#0a0a0a_75%)]"
        />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pt-36 lg:pb-24">
          <div className="flex flex-col text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6 flex flex-wrap justify-center gap-2 sm:gap-3 lg:justify-start"
            >
              <Badge
                variant="outline"
                className="border-[#c8ff00]/30 bg-[#c8ff00]/5 px-3 py-1 font-mono text-[#c8ff00]"
              >
                dx = dividend rights
              </Badge>
              <Badge
                variant="outline"
                className="border-white/15 bg-white/[0.03] px-3 py-1 font-mono text-muted-foreground"
              >
                px = principal / price
              </Badge>
              <Badge
                variant="outline"
                className="border-white/15 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground"
              >
                Base + Pyth
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="font-[family-name:var(--font-safira)] text-4xl leading-[1.08] tracking-tight  md:text-6xl"
            >
              <span className="text-[#c8ff00] glow-lime-text">yield </span>
              tokenization for capital efficiency
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mt-5 max-w-xl text-lg font-medium leading-snug text-muted-foreground sm:text-xl lg:max-w-lg"
            >
              One ERC-20 becomes two: dx accrues dividends from rebases; px is
              your levered, session-bound handle on spot. Trade them separately,
              then burn both to redeem the underlying.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground/90 sm:text-base"
            >
              Built for tokenized equities like AAPL, ABT, and SPY xStocks --
              not a wrapped CEX IOU, not a synthetic from thin air.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <Link
                href="/app"
                className={buttonVariants({ size: "lg", className: "bg-[#c8ff00] text-[#0a0a0a] hover:bg-[#c8ff00]/80 font-semibold px-6" })}
              >
                Open app
                <ArrowRight className="ml-1 size-4" />
              </Link>
              <Link
                href="/docs"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Protocol docs
              </Link>
            </motion.div>
          </div>

          <div className="flex w-full justify-center lg:justify-end lg:pl-4">
            <HeroSplitVisual />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* How It Works                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            How It Works
          </Badge>
          <h2 className="font-[family-name:var(--font-safira)] text-3xl sm:text-4xl">
            From one xStock to two tokens
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <Card className="relative h-full border-l-2 border-l-[#c8ff00]/40 bg-card/60">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="font-[family-name:var(--font-safira)] text-2xl text-[#c8ff00]">
                        {step.num}
                      </span>
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-2 text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Token Architecture                                                */}
      {/* ----------------------------------------------------------------- */}
      <Section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Token Architecture
          </Badge>
          <h2 className="font-[family-name:var(--font-safira)] text-3xl sm:text-4xl">
            Two tokens, two liquidity regimes
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* xdSPY */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-t-2 border-t-[#c8ff00]/60">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#c8ff00]/10">
                    <DollarSign className="size-5 text-[#c8ff00]" />
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs font-mono">
                      dx
                    </Badge>
                  </div>
                </div>
                <CardTitle className="mt-3 text-xl">Dividend token (dx)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Rebases flow through the vault into dx via an accumulator: px
                  balances do not eat the dividend. Secondary liquidity prices
                  dx against the known schedule and the recombination floor.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Yield</p>
                    <p className="mt-1 text-lg font-semibold text-[#c8ff00]">
                      Rebase-linked
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Liquidity</p>
                    <p className="mt-1 text-lg font-semibold">24/7</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="mr-1 size-3" /> Continuous
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Target className="mr-1 size-3" /> Dividend Yield
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* xpSPY */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-t-2 border-t-[#c8ff00]/60">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#c8ff00]/10">
                    <TrendingUp className="size-5 text-[#c8ff00]" />
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs font-mono">
                      px
                    </Badge>
                  </div>
                </div>
                <CardTitle className="mt-3 text-xl">Principal token (px)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  px is the levered, session-gated leg: long or short against
                  USDC while the equity session is open, with Pyth marking spot.
                  Positions are not perpetuals; they roll with the protocol&apos;s
                  daily cadence.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Exposure</p>
                    <p className="mt-1 text-lg font-semibold text-[#c8ff00]">
                      Leveraged spot
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Session</p>
                    <p className="mt-1 text-lg font-semibold">NYSE</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="mr-1 size-3" /> Leveraged
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <BarChart3 className="mr-1 size-3" /> Price Exposure
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* For Every Trader                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Use Cases
          </Badge>
          <h2 className="font-[family-name:var(--font-safira)] text-3xl sm:text-4xl">
            For every trader
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {personas.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="h-full bg-card/60">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#c8ff00]/10">
                      <Icon className="size-5 text-[#c8ff00]" />
                    </div>
                    <CardTitle className="mt-2">
                      {p.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({p.title})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {p.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Protocol facts                                                    */}
      {/* ----------------------------------------------------------------- */}
      <Section className="border-y border-border bg-card/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-20 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <p className="font-[family-name:var(--font-safira)] text-xl leading-tight text-foreground sm:text-2xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* CTA Banner                                                        */}
      {/* ----------------------------------------------------------------- */}
      <Section className="relative overflow-hidden bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0a0a_70%)]" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-32 text-center sm:px-6 lg:px-8">
          <h2 className="font-[family-name:var(--font-safira)] text-4xl sm:text-5xl">
            Route yield and price{" "}
            <span className="text-[#c8ff00] glow-lime-text">your way</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Explore the vault, markets, and docs. Mainnet rollout follows the
            roadmap in the PRD.
          </p>
          <div className="mt-10">
            <Link
              href="/app"
              className={buttonVariants({ size: "lg", className: "bg-[#c8ff00] text-[#0a0a0a] hover:bg-[#c8ff00]/80 font-semibold px-8" })}
            >
              Open app
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
