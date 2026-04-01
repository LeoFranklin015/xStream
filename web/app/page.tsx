"use client";

import { useState } from "react";
import { useAccount } from "@/app/providers";
import { Navbar } from "@/components/navbar";
import { ConnectModal } from "@/components/connect-modal";
import { SendCallsModal } from "@/components/send-calls-modal";
import { SignModal } from "@/components/sign-modal";

type ModalType = "connect" | "send" | "sign" | null;

export default function Home() {
  const { account, isRestoring } = useAccount();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const examples = [
    {
      id: "connect" as const,
      title: "Connect",
      description: "Create or load a passkey-based smart account. View stored passkeys and manage your connection.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      ),
      color: "blue",
      available: true,
    },
    {
      id: "send" as const,
      title: "Send Wallet Calls",
      description: "Send single or batched transactions using wallet_sendCalls. Supports gas estimation.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
      color: "violet",
      available: !!account,
    },
    {
      id: "sign" as const,
      title: "Sign Message",
      description: "Sign personal messages (EIP-191) or typed structured data (EIP-712) with your passkey.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      color: "emerald",
      available: !!account,
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: "text-blue-400",
      hover: "hover:border-blue-500/40 hover:bg-blue-500/15",
    },
    violet: {
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      icon: "text-violet-400",
      hover: "hover:border-violet-500/40 hover:bg-violet-500/15",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: "text-emerald-400",
      hover: "hover:border-emerald-500/40 hover:bg-emerald-500/15",
    },
  };

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="text-sm text-zinc-500">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar onConnect={() => setActiveModal("connect")} />

      <main className="mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            xStocks Wallet
          </h1>
          <p className="mx-auto max-w-lg text-lg text-zinc-400">
            Passkey-powered smart accounts. Connect, sign, and transact — all with biometric authentication.
          </p>
          {!account && (
            <button
              onClick={() => setActiveModal("connect")}
              className="mt-8 rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Example Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {examples.map((example) => {
            const colors = colorMap[example.color];
            return (
              <button
                key={example.id}
                onClick={() => setActiveModal(example.id)}
                disabled={!example.available}
                className={`group relative rounded-2xl border p-6 text-left transition-all duration-200 ${
                  example.available
                    ? `${colors.border} ${colors.bg} ${colors.hover} cursor-pointer`
                    : "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50"
                }`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.icon}`}>
                  {example.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">
                  {example.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {example.description}
                </p>
                {!example.available && (
                  <p className="mt-3 text-xs text-zinc-600">Connect wallet first</p>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Modals */}
      <ConnectModal open={activeModal === "connect"} onClose={() => setActiveModal(null)} />
      <SendCallsModal open={activeModal === "send"} onClose={() => setActiveModal(null)} />
      <SignModal open={activeModal === "sign"} onClose={() => setActiveModal(null)} />
    </div>
  );
}
