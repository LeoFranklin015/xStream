"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DocsNavItem } from "@/lib/docs-toc";

type DocsNavProps = {
  items: DocsNavItem[];
  className?: string;
  variant?: "sidebar" | "mobile";
};

export function DocsNav({ items, className, variant = "sidebar" }: DocsNavProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const ids = items.map((i) => i.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-64px 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    elements.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);

  const linkClass = (id: string) =>
    cn(
      "block rounded-lg border-l-2 px-3 py-2 text-sm transition-colors",
      variant === "sidebar" && "-ml-px",
      activeId === id
        ? "border-accent bg-accent/10 font-medium text-foreground"
        : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    );

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Documentation sections"
        className={cn(
          "no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-border bg-background/90 px-4 pb-3 pt-1 backdrop-blur-md lg:hidden",
          className
        )}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeId === item.id
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Documentation sections"
      className={cn("sticky top-24", className)}
    >
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Sections
      </p>
      <ul className="flex max-h-[calc(100vh-8rem)] flex-col gap-0.5 overflow-y-auto pr-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`#${item.id}`} className={linkClass(item.id)}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
