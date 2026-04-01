"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { Account } from "@jaw.id/core";
import { getAccountConfig } from "@/lib/constants";

interface AccountContextValue {
  account: Account | null;
  setAccount: (account: Account | null) => void;
  logout: () => void;
  isRestoring: boolean;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccountState] = useState<Account | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_JAW_API_KEY!;
  const config = getAccountConfig();

  const setAccount = useCallback((acc: Account | null) => {
    setAccountState(acc);
  }, []);

  // Restore session on mount using the SDK's own jaw:passkey:authState
  useEffect(() => {
    const restore = async () => {
      try {
        const currentAccount = Account.getCurrentAccount(apiKey);
        if (currentAccount?.credentialId && currentAccount?.publicKey) {
          const acc = await Account.restore(
            config,
            currentAccount.credentialId,
            currentAccount.publicKey
          );
          setAccountState(acc);
        }
      } catch {
        // Auth state is stale, ignore
      } finally {
        setIsRestoring(false);
      }
    };
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    Account.logout(apiKey);
    setAccountState(null);
  }, [apiKey]);

  return (
    <AccountContext.Provider value={{ account, setAccount, logout, isRestoring }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
}
