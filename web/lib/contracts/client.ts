import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  type PublicClient,
  type WalletClient,
  type Chain,
} from "viem";
import { DEFAULT_CHAIN } from "./config";

// Public client for read-only calls (no wallet needed)
export function getPublicClient(chain: Chain = DEFAULT_CHAIN): PublicClient {
  return createPublicClient({
    chain,
    transport: http(),
  });
}

// Wallet client from an EIP-1193 provider (Privy gives you this)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWalletClient(
  provider: { request: (...args: any[]) => Promise<any> },
  chain: Chain = DEFAULT_CHAIN
): WalletClient {
  return createWalletClient({
    chain,
    transport: custom(provider as Parameters<typeof custom>[0]),
  });
}
