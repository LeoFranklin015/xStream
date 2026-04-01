"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 120, damping: 18 };

type HeroSplitVisualProps = {
  className?: string;
};

export default function HeroSplitVisual({ className }: HeroSplitVisualProps) {
  return (
    <div
      className={cn("relative w-full max-w-lg select-none", className)}
      aria-hidden
    >
      <div className="relative aspect-[16/10] rounded-2xl border border-white/[0.08] bg-[#0e0e0e]/80 p-6 shadow-[0_0_0_1px_rgba(200,255,0,0.06)] backdrop-blur-sm">
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
            <span>Vault</span>
            <motion.span
              className="rounded-full border border-[#c8ff00]/25 bg-[#c8ff00]/10 px-2 py-0.5 font-mono text-[#c8ff00]"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Base
            </motion.span>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center gap-4 py-2">
            <motion.div
              layout
              className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent px-5 py-3 text-center"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...spring, delay: 0.1 }}
            >
              <p className="font-mono text-[11px] text-muted-foreground sm:text-xs">
                xStock (ERC-20)
              </p>
              <p className="mt-1 font-[family-name:var(--font-safira)] text-lg text-foreground sm:text-xl">
                AAPL / ABT / SPY
              </p>
            </motion.div>

            <div className="relative flex h-14 w-full items-center justify-center">
              <motion.div
                className="absolute top-0 h-8 w-px bg-gradient-to-b from-[#c8ff00]/80 to-transparent"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.45, ease: "easeOut" }}
                style={{ originY: 0 }}
              />
              <motion.div
                className="absolute top-7 h-px w-[55%] bg-gradient-to-r from-transparent via-[#c8ff00]/50 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute bottom-0 left-[22%] h-7 w-px bg-gradient-to-b from-[#c8ff00]/60 to-[#c8ff00]/20"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.75, duration: 0.4, ease: "easeOut" }}
                style={{ originY: 0 }}
              />
              <motion.div
                className="absolute bottom-0 right-[22%] h-7 w-px bg-gradient-to-b from-[#c8ff00]/60 to-[#c8ff00]/20"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.75, duration: 0.4, ease: "easeOut" }}
                style={{ originY: 0 }}
              />
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              <motion.div
                className="rounded-xl border border-[#c8ff00]/20 bg-[#c8ff00]/[0.06] p-4 text-left"
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ...spring, delay: 0.85 }}
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-[#c8ff00] sm:text-[11px]">
                  dx
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dividend yield, 24/7
                </p>
                <motion.div
                  className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <motion.div
                    className="h-full rounded-full bg-[#c8ff00]/70"
                    animate={{ width: ["35%", "72%", "48%", "65%"] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </motion.div>

              <motion.div
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left"
                initial={{ x: 12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ...spring, delay: 0.85 }}
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-foreground sm:text-[11px]">
                  px
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Price, NYSE session
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <motion.span
                    className="inline-block size-1.5 rounded-full bg-emerald-500"
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Pyth oracle
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          <p className="text-center font-mono text-[9px] text-muted-foreground/80 sm:text-[10px]">
            Recombine dx + px to redeem xStock
          </p>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute -right-6 -top-4 hidden h-24 w-24 rounded-full bg-[#c8ff00]/10 blur-2xl sm:block"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-6 -left-8 hidden h-20 w-32 rounded-full bg-[#c8ff00]/5 blur-3xl sm:block"
        animate={{ x: [0, 6, 0], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
