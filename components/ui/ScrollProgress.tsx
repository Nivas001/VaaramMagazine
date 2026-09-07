"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * ScrollProgress
 * Fixed progress bar at the very top of the screen tracking page scroll.
 * High-voltage Channel 199 crimson red (#cd2129).
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[100] h-[3px] origin-left bg-[#cd2129] shadow-[0_0_12px_#cd2129]"
    />
  );
}
