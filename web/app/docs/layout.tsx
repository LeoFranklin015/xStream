import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Documentation — ${APP_NAME}`,
  description: `Introduction (Pendle-style yield split, adapted to dividend xStocks), then how ${APP_NAME} splits xStocks into dx and px, vault, exchange, and oracles on Base.`,
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
