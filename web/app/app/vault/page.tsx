"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  Gift,
  Lock,
  DollarSign,
  Percent,
  Coins,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode } from "@/lib/mode-context";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { xStockAssets, type Asset } from "@/lib/market-data";
import { useVault } from "@/lib/contracts/useVault";
import { usePythPrices } from "@/lib/use-pyth-prices";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

type VaultMode = "deposit" | "withdraw";

type VaultStat = {
  label: string;
  value: string;
  icon: typeof Lock | typeof Gift | typeof Percent | typeof DollarSign;
  change: string;
  positive: boolean;
  isBadge?: boolean;
};

function formatUsd(n: number): string {
  return "$" + n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildVaultStats(
  vaultBalanceUsd: number,
  pendingDiv: string,
  dxBalance: string,
): VaultStat[] {
  const divNum = parseFloat(pendingDiv);
  const divDisplay = divNum > 0 ? divNum.toFixed(4) : "0.00";
  const dxNum = parseFloat(dxBalance);
  const rewardPerShare = dxNum > 0 ? (divNum / dxNum) : 0;
  return [
    {
      label: "Vault Balance",
      value: formatUsd(vaultBalanceUsd),
      icon: Lock,
      change: dxNum > 0 ? `${parseFloat(dxBalance).toFixed(2)} tokens` : "--",
      positive: true,
      isBadge: true,
    },
    {
      label: "Claimable Rewards",
      value: divDisplay,
      icon: Gift,
      change: "Claim",
      positive: true,
      isBadge: true,
    },
    {
      label: "Vault APY",
      value: "4.82%",
      icon: Percent,
      change: "+0.32%",
      positive: true,
    },
    {
      label: "Reward / Share",
      value: rewardPerShare > 0 ? rewardPerShare.toFixed(6) : "0.0000",
      icon: DollarSign,
      change: "xStock",
      positive: true,
      isBadge: true,
    },
  ];
}

// ---- Token Pill (Uniswap-style) ----
function TokenPill({
  asset,
  label,
  onClick,
  color,
}: {
  asset?: Asset;
  label: string;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-full border border-border/60 bg-muted/40 px-4 py-2.5 hover:bg-muted/60 transition-colors shrink-0"
    >
      {asset?.logo ? (
        <img
          src={asset.logo}
          alt={asset.symbol}
          className="size-7 rounded-full object-cover"
        />
      ) : (
        <div
          className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: color || asset?.color || "#888" }}
        >
          {label.slice(0, 2)}
        </div>
      )}
      <span className="text-base font-semibold text-foreground">{label}</span>
      {onClick && <ChevronDown className="size-4 text-muted-foreground" />}
    </button>
  );
}

// ---- Asset Selector Dropdown ----
function AssetSelector({
  selected,
  onSelect,
}: {
  selected: Asset;
  onSelect: (a: Asset) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <TokenPill
        asset={selected}
        label={`x${selected.symbol}`}
        onClick={() => setOpen(!open)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-50 w-64 rounded-xl border border-border/50 bg-card shadow-xl py-1.5 overflow-hidden"
          >
            {xStockAssets.map((asset) => {
              const isSelected = selected.symbol === asset.symbol;
              return (
                <button
                  key={asset.ticker}
                  type="button"
                  onClick={() => {
                    onSelect(asset);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "bg-primary/5 text-primary"
                      : "hover:bg-muted/30 text-foreground"
                  )}
                >
                  {asset.logo ? (
                    <img
                      src={asset.logo}
                      alt={asset.symbol}
                      className="size-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: asset.color }}
                    >
                      {asset.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      x{asset.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {asset.name}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="size-2 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Mode Tabs (Uniswap-style inline) ----
function VaultModeTabs({
  value,
  onChange,
}: {
  value: VaultMode;
  onChange: (v: VaultMode) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {(["deposit", "withdraw"] as VaultMode[]).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "px-4 py-2 rounded-full text-base font-semibold transition-all duration-200",
            value === id
              ? "bg-muted/60 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {id === "deposit" ? "Deposit" : "Withdraw"}
        </button>
      ))}
    </div>
  );
}

// ---- Balances hook ----
function useVaultBalances(asset: Asset) {
  const { getBalances, getPendingDividend } = useVault();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [balances, setBalances] = useState({ xStock: "0", px: "0", dx: "0" });
  const [pendingDiv, setPendingDiv] = useState("0");
  const [loading, setLoading] = useState(false);

  const hasWallet = authenticated && wallets.length > 0;

  const refresh = useCallback(async () => {
    if (!hasWallet) return;
    setLoading(true);
    try {
      const bals = await getBalances(asset.symbol);
      setBalances(bals);
    } catch (err) {
      console.error("[useVaultBalances] balances fetch failed:", err);
    }
    try {
      const div = await getPendingDividend(asset.symbol);
      setPendingDiv(div);
    } catch {
      // pendingDividend reverts if user has no vault position -- expected
      setPendingDiv("0");
    }
    setLoading(false);
  }, [hasWallet, asset.symbol, getBalances, getPendingDividend]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balances, pendingDiv, loading, refresh };
}

// ---- Deposit Tab ----
function DepositTab({
  asset,
  xStockBalance,
  onSuccess,
}: {
  asset: Asset;
  xStockBalance: string;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const numAmount = parseFloat(amount) || 0;
  const clean = (v: string) => v.replace(/[^0-9.]/g, "");
  const { deposit, isLoading, error } = useVault();
  const { authenticated } = usePrivy();

  const xSymbol = `x${asset.symbol}`;
  const xdSymbol = `xd${asset.symbol}`;
  const xpSymbol = `xp${asset.symbol}`;

  const handleDeposit = async () => {
    if (numAmount <= 0) return;
    try {
      await deposit(asset.symbol, amount);
      setAmount("");
      onSuccess();
    } catch {
      // error is set in hook
    }
  };

  const displayBalance = parseFloat(xStockBalance).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  return (
    <div className="space-y-1">
      {/* Input: You Deposit */}
      <div className="rounded-2xl bg-muted/30 border border-border/40 p-5">
        <p className="text-sm text-muted-foreground font-medium mb-3">
          You Deposit
        </p>
        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(clean(e.target.value))}
            className="min-w-0 flex-1 bg-transparent text-4xl md:text-5xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 font-mono"
          />
          <AssetSelector selected={asset} onSelect={() => { }} />
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Balance: {displayBalance} {xSymbol}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex justify-center -my-4 relative z-10">
        <div className="size-10 rounded-xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
          <ArrowDown className="size-5 text-muted-foreground" />
        </div>
      </div>

      {/* Output: You Receive */}
      <div className="rounded-2xl bg-muted/20 border border-border/40 p-5">
        <p className="text-sm text-muted-foreground font-medium mb-3">
          You Receive
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Coins className="size-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">{xdSymbol}</p>
                <p className="text-xs text-muted-foreground">Income Token</p>
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-semibold font-mono tracking-tight text-foreground">
              {numAmount > 0 ? numAmount.toFixed(2) : "0"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Coins className="size-4 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">{xpSymbol}</p>
                <p className="text-xs text-muted-foreground">Price Token</p>
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-semibold font-mono tracking-tight text-foreground">
              {numAmount > 0 ? numAmount.toFixed(2) : "0"}
            </p>
          </div>
        </div>
      </div>

      {/* Split ratio detail */}
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
        <Coins className="size-3" />
        <span>
          1 {xSymbol} = 1 {xdSymbol} + 1 {xpSymbol}
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center px-2">{error}</p>
      )}

      {/* CTA */}
      <Button
        type="button"
        disabled={numAmount <= 0 || isLoading || !authenticated}
        onClick={handleDeposit}
        className="w-full h-14 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-30 shadow-lg shadow-primary/10"
      >
        {isLoading ? (
          <Loader2 className="size-5 mr-2.5 animate-spin" />
        ) : (
          <ArrowDownToLine className="size-5 mr-2.5" />
        )}
        {isLoading ? "Depositing..." : `Deposit ${xSymbol}`}
      </Button>
    </div>
  );
}

// ---- Withdraw Tab ----
function WithdrawTab({
  asset,
  dxBalance,
  pxBalance,
  onSuccess,
}: {
  asset: Asset;
  dxBalance: string;
  pxBalance: string;
  onSuccess: () => void;
}) {
  const [returnAmount, setReturnAmount] = useState("");
  const clean = (v: string) => v.replace(/[^0-9.]/g, "");
  const numReturn = parseFloat(returnAmount) || 0;
  const { withdraw, isLoading, error } = useVault();
  const { authenticated } = usePrivy();

  const xSymbol = `x${asset.symbol}`;
  const xdSymbol = `xd${asset.symbol}`;
  const xpSymbol = `xp${asset.symbol}`;

  const handleWithdraw = async () => {
    if (numReturn <= 0) return;
    try {
      await withdraw(asset.symbol, returnAmount);
      setReturnAmount("");
      onSuccess();
    } catch {
      // error is set in hook
    }
  };

  const fmtBal = (v: string) =>
    parseFloat(v).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });

  return (
    <div className="space-y-1">
      {/* Input: You Return */}
      <div className="rounded-2xl bg-muted/30 border border-border/40 p-5">
        <p className="text-sm text-muted-foreground font-medium mb-3">
          You Return (Equal Amounts)
        </p>

        {/* xd input */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={returnAmount}
            onChange={(e) => setReturnAmount(clean(e.target.value))}
            className="min-w-0 flex-1 bg-transparent text-4xl md:text-5xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 font-mono"
          />
          <TokenPill label={xdSymbol} color="#3b82f6" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Balance: {fmtBal(dxBalance)} {xdSymbol}
        </p>

        <Separator className="opacity-30 my-4" />

        {/* xp input (synced) */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground font-mono">
            {numReturn > 0 ? returnAmount : "0"}
          </p>
          <TokenPill label={xpSymbol} color="#8b5cf6" />
        </div>
        <p className="text-sm text-muted-foreground">
          Balance: {fmtBal(pxBalance)} {xpSymbol}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex justify-center -my-4 relative z-10">
        <div className="size-10 rounded-xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
          <ArrowDown className="size-5 text-muted-foreground" />
        </div>
      </div>

      {/* Output: You Receive */}
      <div className="rounded-2xl bg-muted/20 border border-border/40 p-5">
        <p className="text-sm text-muted-foreground font-medium mb-3">
          You Receive
        </p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-4xl md:text-5xl font-semibold font-mono tracking-tight text-foreground">
            {numReturn > 0 ? numReturn.toFixed(2) : "0"}
          </p>
          <AssetSelector selected={asset} onSelect={() => { }} />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center px-2">{error}</p>
      )}

      {/* CTA */}
      <div className="pt-2">
        <Button
          type="button"
          disabled={numReturn <= 0 || isLoading || !authenticated}
          onClick={handleWithdraw}
          variant="outline"
          className="w-full h-14 rounded-2xl text-lg font-semibold disabled:opacity-30"
        >
          {isLoading ? (
            <Loader2 className="size-5 mr-2.5 animate-spin" />
          ) : (
            <ArrowUpFromLine className="size-5 mr-2.5" />
          )}
          {isLoading ? "Withdrawing..." : `Withdraw ${xSymbol}`}
        </Button>
      </div>
    </div>
  );
}

// ---- How It Works ----
const steps = [
  {
    n: "01",
    title: "Deposit xStock",
    desc: "Send your tokenized stock into the vault.",
  },
  {
    n: "02",
    title: "Receive dx + px",
    desc: "Vault mints equal income and price tokens 1:1.",
  },
  {
    n: "03",
    title: "Earn & Trade",
    desc: "xdToken accrues dividends. xpToken tracks price.",
  },
  {
    n: "04",
    title: "Recombine",
    desc: "Return equal amounts to withdraw original xStock.",
  },
];

// ====== Expert Vault ======
function ExpertVault() {
  const [vaultMode, setVaultMode] = useState<VaultMode>("deposit");
  const [selectedAsset, setSelectedAsset] = useState<Asset>(xStockAssets[3]);
  const { balances, pendingDiv, refresh } = useVaultBalances(selectedAsset);
  const liveAssets = usePythPrices();
  const liveAsset = liveAssets.find((a) => a.symbol === selectedAsset.symbol);
  const assetPrice = liveAsset?.price ?? 0;
  // dx balance = deposited tokens (1:1 with deposit)
  const dxNum = parseFloat(balances.dx) || 0;
  const vaultBalanceUsd = dxNum * assetPrice;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp}>
        <h1 className="font-bold text-2xl md:text-5xl tracking-tight">
          Vault
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Split tokenized stocks into income and price exposure tokens.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {buildVaultStats(vaultBalanceUsd, pendingDiv, balances.dx).map((stat, i) => (
          <motion.div
            key={stat.label}
            className="h-full"
            {...fadeUp}
            transition={{ delay: 0.05 * (i + 1) }}
          >
            <Card className="h-full hover:border-primary/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between px-4 pt-4">
                <span className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </span>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="min-h-9">
                  <div className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.isBadge ? (
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                      {stat.change}
                    </Badge>
                  ) : (
                    <span
                      className={`text-xs font-medium ${stat.positive ? "text-green-500" : "text-red-500"
                        }`}
                    >
                      {stat.change}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Swap card + How it works (right column, vertical steps) */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
        <div className="flex flex-1 justify-start min-w-0">
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.25 }}
            className="w-full max-w-xl"
          >
            <Card className="overflow-visible">
              <CardHeader className="px-6 pt-6 pb-4">
                <VaultModeTabs value={vaultMode} onChange={setVaultMode} />
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={vaultMode + selectedAsset.symbol}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {vaultMode === "deposit" ? (
                      <DepositTab
                        asset={selectedAsset}
                        xStockBalance={balances.xStock}
                        onSuccess={refresh}
                      />
                    ) : (
                      <WithdrawTab
                        asset={selectedAsset}
                        dxBalance={balances.dx}
                        pxBalance={balances.px}
                        onSuccess={refresh}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.35 }}
          className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24"
        >
          <Card>
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-sm font-medium">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="flex flex-col gap-4">
                {steps.map((s) => (
                  <div key={s.n} className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {s.n}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ====== Grandma Vault ======
function GrandmaVault() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset>(xStockAssets[3]);
  const { balances, pendingDiv, refresh } = useVaultBalances(selectedAsset);
  const { deposit, withdraw, claimDividend, isLoading, error } = useVault();
  const { authenticated } = usePrivy();
  const liveAssets = usePythPrices();
  const liveAsset = liveAssets.find((a) => a.symbol === selectedAsset.symbol);
  const assetPrice = liveAsset?.price ?? 0;
  const dxNum = parseFloat(balances.dx) || 0;
  const vaultBalanceUsd = dxNum * assetPrice;

  const depositNum = parseFloat(depositAmount) || 0;
  const withdrawNum = parseFloat(withdrawAmount) || 0;
  const xSymbol = `x${selectedAsset.symbol}`;

  const fmtBal = (v: string) =>
    parseFloat(v).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });

  const handleDeposit = async () => {
    if (depositNum <= 0) return;
    try {
      await deposit(selectedAsset.symbol, depositAmount);
      setDepositAmount("");
      refresh();
    } catch { /* error in hook */ }
  };

  const handleWithdraw = async () => {
    if (withdrawNum <= 0) return;
    try {
      await withdraw(selectedAsset.symbol, withdrawAmount);
      setWithdrawAmount("");
      refresh();
    } catch { /* error in hook */ }
  };

  const handleClaim = async () => {
    try {
      await claimDividend(selectedAsset.symbol);
      refresh();
    } catch { /* error in hook */ }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp}>
        <h1 className="font-bold text-2xl md:text-3xl tracking-tight">
          Your Savings Vault
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Put your money to work and earn regular income.
        </p>
      </motion.div>

      {/* Balance card */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Vault Balance</p>
            <p className="text-4xl font-semibold text-foreground tracking-tight">
              {formatUsd(vaultBalanceUsd)}
            </p>
            {dxNum > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {dxNum.toFixed(2)} xd{selectedAsset.symbol} @ {formatUsd(assetPrice)}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
        <div className="flex-1 min-w-0 space-y-6 max-w-2xl mx-auto w-full lg:mx-0">
          {/* Asset selector */}
          <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
              {selectedAsset.logo ? (
                <img
                  src={selectedAsset.logo}
                  alt={selectedAsset.symbol}
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <div
                  className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: selectedAsset.color }}
                >
                  {selectedAsset.symbol.slice(0, 2)}
                </div>
              )}
              <div className="flex-1">
                <p className="text-base font-semibold">x{selectedAsset.symbol}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedAsset.name}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedAsset.type}
              </Badge>
            </div>
          </motion.div>

          {/* Deposit */}
          <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
            <Card className="border-primary/20">
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowDownToLine className="size-4 text-primary" />
                  </div>
                  Put Money In
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-2 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2.5 block">
                    How much {xSymbol} do you want to deposit?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={depositAmount}
                      onChange={(e) =>
                        setDepositAmount(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      className="w-full rounded-xl border border-border/50 bg-muted/30 px-5 py-4 text-3xl font-semibold font-mono outline-none pr-24 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-shadow"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      {xSymbol}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Available: {fmtBal(balances.xStock)} {xSymbol}
                  </p>
                </div>
                {error && (
                  <p className="text-xs text-red-500 text-center">{error}</p>
                )}
                <Button
                  className="w-full h-14 rounded-xl bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary/80"
                  disabled={depositNum <= 0 || isLoading || !authenticated}
                  onClick={handleDeposit}
                >
                  {isLoading ? (
                    <Loader2 className="size-5 mr-2 animate-spin" />
                  ) : null}
                  {isLoading ? "Depositing..." : "Deposit"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Withdraw */}
          <motion.div {...fadeUp} transition={{ delay: 0.18 }}>
            <Card>
              <CardHeader className="px-5 pt-5 pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-3">
                  <div className="size-9 rounded-full bg-muted flex items-center justify-center">
                    <ArrowUpFromLine className="size-4 text-muted-foreground" />
                  </div>
                  Take Money Out
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-2 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2.5 block">
                    How much {xSymbol} do you want to withdraw?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={withdrawAmount}
                      onChange={(e) =>
                        setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      className="w-full rounded-xl border border-border/50 bg-muted/30 px-5 py-4 text-3xl font-semibold font-mono outline-none pr-24 focus:border-foreground/20 focus:ring-2 focus:ring-foreground/5 transition-shadow"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      {xSymbol}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    In vault: {fmtBal(balances.dx)} xd{selectedAsset.symbol} / {fmtBal(balances.px)} xp{selectedAsset.symbol}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-xl text-lg font-semibold"
                  disabled={withdrawNum <= 0 || isLoading || !authenticated}
                  onClick={handleWithdraw}
                >
                  {isLoading ? (
                    <Loader2 className="size-5 mr-2 animate-spin" />
                  ) : null}
                  {isLoading ? "Withdrawing..." : "Withdraw"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Earnings */}
          <motion.div {...fadeUp} transition={{ delay: 0.24 }}>
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center space-y-4">
                <Gift className="size-10 text-primary mx-auto" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Earnings Ready to Collect
                  </p>
                  <p className="text-4xl font-semibold text-primary font-mono tracking-tight mt-1">
                    {parseFloat(pendingDiv) > 0 ? parseFloat(pendingDiv).toFixed(4) : "0.00"}
                  </p>
                </div>
                <Button
                  className="w-full h-14 rounded-xl bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary/80"
                  disabled={parseFloat(pendingDiv) <= 0 || isLoading || !authenticated}
                  onClick={handleClaim}
                >
                  {isLoading ? (
                    <Loader2 className="size-5 mr-2.5 animate-spin" />
                  ) : (
                    <Gift className="size-5 mr-2.5" />
                  )}
                  {isLoading ? "Claiming..." : "Collect Earnings"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Next payment expected: Apr 15, 2026
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24"
        >
          <Card>
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-sm font-medium">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="flex flex-col gap-4">
                {[
                  {
                    n: "1",
                    title: "Put money in",
                    desc: "Deposit your stock tokens",
                  },
                  {
                    n: "2",
                    title: "Vault splits it",
                    desc: "Get Income + Price tokens",
                  },
                  {
                    n: "3",
                    title: "Earn payments",
                    desc: "Income token pays regularly",
                  },
                  {
                    n: "4",
                    title: "Take money out",
                    desc: "Return both tokens to withdraw",
                  },
                ].map((s) => (
                  <div
                    key={s.n}
                    className="rounded-xl bg-muted/30 p-4 border border-border/50"
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 mb-2.5">
                      <span className="text-xs font-bold text-primary">
                        {s.n}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const { mode } = useAppMode();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {mode === "expert" ? <ExpertVault /> : <GrandmaVault />}
      </motion.div>
    </AnimatePresence>
  );
}
