"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";
import { frame, cancelFrame } from "framer-motion";

export default function LenisMotionRaf() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    const onFrame = ({ timestamp }: { timestamp: number }) => {
      lenis.raf(timestamp);
    };
    frame.update(onFrame, true);
    return () => cancelFrame(onFrame);
  }, [lenis]);

  return null;
}
