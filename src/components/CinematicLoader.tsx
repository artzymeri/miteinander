"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface CinematicLoaderProps {
  onLoadingComplete: () => void;
}

export default function CinematicLoader({ onLoadingComplete }: CinematicLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showCurtain, setShowCurtain] = useState(false);

  useEffect(() => {
    // SVG animation completes, then text fades in, then curtain opens
    const timer = setTimeout(() => {
      setShowCurtain(true);
      setTimeout(() => {
        setIsLoading(false);
        onLoadingComplete();
      }, 800);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          {/* Left Curtain */}
          <motion.div
            className="fixed top-0 left-0 w-1/2 h-full bg-[#1a4a4a] z-[9999] flex items-center justify-end"
            initial={{ x: 0 }}
            animate={{ x: showCurtain ? "-100%" : 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="w-full flex items-center justify-center">
              {/* Content only on left side when not splitting */}
            </div>
          </motion.div>

          {/* Right Curtain */}
          <motion.div
            className="fixed top-0 right-0 w-1/2 h-full bg-[#1a4a4a] z-[9999] flex items-center justify-start"
            initial={{ x: 0 }}
            animate={{ x: showCurtain ? "100%" : 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="w-full flex items-center justify-center">
              {/* Content only on right side when not splitting */}
            </div>
          </motion.div>

          {/* Center Content Overlay */}
          <motion.div
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: showCurtain ? 0 : 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* SVG Animation - Two lines meeting to form M/Heart - matches actual logo */}
            <div className="relative w-56 h-48 mb-8">
              <svg
                viewBox="0 0 120 100"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Left coral curved line coming from left */}
                <motion.path
                  d="M 5 85 Q 15 85 25 65 Q 35 45 45 40"
                  stroke="#e07a5f"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                />
                {/* Right coral curved line coming from right */}
                <motion.path
                  d="M 115 85 Q 105 85 95 65 Q 85 45 75 40"
                  stroke="#e07a5f"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                />
                {/* White heart outline */}
                <motion.path
                  d="M 60 30 C 45 15 20 20 25 45 C 30 65 60 85 60 85 C 60 85 90 65 95 45 C 100 20 75 15 60 30"
                  stroke="#f5f5f0"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeInOut", delay: 1.2 }}
                />
                {/* White M letter inside heart */}
                <motion.path
                  d="M 35 70 L 35 40 L 60 55 L 85 40 L 85 70"
                  stroke="#f5f5f0"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut", delay: 1.8 }}
                />
              </svg>
            </div>

            {/* Text fade in */}
            <motion.h1
              className="text-4xl md:text-5xl font-serif text-[#f5f5f0] tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.2 }}
            >
              Miteinander
            </motion.h1>

            <motion.p
              className="text-[#e07a5f] text-sm tracking-[0.3em] uppercase mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.6 }}
            >
              Fürsorge verbindet
            </motion.p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
