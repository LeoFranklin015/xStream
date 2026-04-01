import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — xstream",
  description:
    "How xstream splits xStocks into dividend (dx) and principal (px) tokens, vault, exchange, and oracles on Base.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
