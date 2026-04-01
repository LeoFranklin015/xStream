import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor pitch — xstream",
  description:
    "xStream protocol: split xStocks into dividend (dx) and principal (px) tokens on Base.",
};

export default function PitchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
