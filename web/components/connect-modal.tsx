"use client";

import { useState, useEffect } from "react";
import { Account } from "@jaw.id/core";
import { useAccount } from "@/app/providers";
import { getAccountConfig } from "@/lib/constants";
import { Modal } from "./modal";

interface StoredAccount {
  credentialId: string;
  username: string;
  publicKey: string;
  creationDate: string;
  isImported: boolean;
  address?: string; // resolved from our session storage
}

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectModal({ open, onClose }: ConnectModalProps) {
  const { account, setAccount, logout } = useAccount();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedAccounts, setStoredAccounts] = useState<StoredAccount[]>([]);

  const config = getAccountConfig();
  const apiKey = process.env.NEXT_PUBLIC_JAW_API_KEY!;

  useEffect(() => {
    if (!open) return;
    try {
      const accounts = (Account.getStoredAccounts(apiKey) ?? []) as unknown as StoredAccount[];

      // Enrich with address from the SDK's own authState (jaw:passkey:authState)
      const authState = Account.getAuthenticatedAddress(apiKey);
      const currentAccount = Account.getCurrentAccount(apiKey);

      const enriched = accounts.map((a) => ({
        ...a,
        address:
          currentAccount?.credentialId === a.credentialId && authState
            ? authState
            : undefined,
      }));

      setStoredAccounts(enriched);
    } catch {
      setStoredAccounts([]);
    }
  }, [apiKey, account, open]);

  const handleCreate = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const acc = await Account.create(config, { username: username.trim() });
      setAccount(acc);
      setUsername("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWith = async (credentialId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const acc = await Account.get(config, credentialId);
      setAccount(acc);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const acc = await Account.import(config);
      setAccount(acc);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setError(null);
  };

  return (
    <Modal open={open} onClose={onClose} title={account ? "Account" : "Connect"}>
      {account ? (
        <div className="space-y-5">
          <div className="rounded-xl bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">Connected</p>
                {account.getMetadata()?.username && (
                  <p className="text-xs text-zinc-400">{account.getMetadata()?.username}</p>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-500">Address</span>
                <p className="mt-0.5 break-all font-mono text-xs text-zinc-300">{account.address}</p>
              </div>
              <div>
                <span className="text-zinc-500">Chain ID</span>
                <p className="mt-0.5 font-mono text-xs text-zinc-300">{account.chainId}</p>
              </div>
              {account.getMetadata()?.credentialId && (
                <div>
                  <span className="text-zinc-500">Credential</span>
                  <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-500">{account.getMetadata()?.credentialId}</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {storedAccounts.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Your Passkeys
              </p>
              <div className="space-y-2">
                {storedAccounts.map((stored) => (
                  <button
                    key={stored.credentialId}
                    onClick={() => handleLoginWith(stored.credentialId)}
                    disabled={isLoading}
                    className="group flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10 disabled:opacity-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.333 7.333H4.667M8 4v6.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <rect x="1" y="1" width="14" height="14" rx="7" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200">
                        {stored.username || "Unnamed Account"}
                      </p>
                      <p className="truncate font-mono text-[11px] text-zinc-500">
                        {stored.address
                          ? `${stored.address.slice(0, 6)}...${stored.address.slice(-4)}`
                          : `Created ${new Date(stored.creationDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      className="shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400"
                    >
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Create New
            </p>
            <div className="rounded-xl bg-white/5 p-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Enter username"
                className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500"
              />
              <button
                onClick={handleCreate}
                disabled={isLoading || !username.trim()}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Passkey Account"}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Import Existing
            </p>
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {isLoading ? "Importing..." : "Import Passkey"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
