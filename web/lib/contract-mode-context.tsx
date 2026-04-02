"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type ContractMode = "prod" | "mock";

type ContractModeContextValue = {
  contractMode: ContractMode;
  setContractMode: (m: ContractMode) => void;
  toggleContractMode: () => void;
  isMock: boolean;
};

const ContractModeContext = createContext<ContractModeContextValue | null>(null);

const STORAGE_KEY = "xstream_contract_mode";

export function ContractModeProvider({ children }: { children: ReactNode }) {
  const [contractMode, setModeState] = useState<ContractMode>("prod");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "prod" || stored === "mock") {
        setModeState(stored);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  function setContractMode(m: ContractMode) {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
  }

  function toggleContractMode() {
    setContractMode(contractMode === "prod" ? "mock" : "prod");
  }

  const value: ContractModeContextValue = {
    contractMode,
    setContractMode,
    toggleContractMode,
    isMock: contractMode === "mock",
  };

  if (!hydrated) return null;

  return (
    <ContractModeContext.Provider value={value}>
      {children}
    </ContractModeContext.Provider>
  );
}

export function useContractMode() {
  const ctx = useContext(ContractModeContext);
  if (!ctx)
    throw new Error("useContractMode must be used within ContractModeProvider");
  return ctx;
}
