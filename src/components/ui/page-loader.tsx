"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Tent } from "lucide-react";

export function PageLoader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
        >
          {/* Outer spinning ring */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="absolute h-20 w-20 rounded-full border-[3px] border-transparent border-t-[#1a2b6b] border-r-[#1a2b6b]/40"
            />
            {/* Middle spinning ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              className="absolute h-14 w-14 rounded-full border-[3px] border-transparent border-t-orange-500 border-r-orange-300"
            />
            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a2b6b] shadow-lg shadow-[#1a2b6b]/30"
            >
              <Tent className="h-5 w-5 text-white" />
            </motion.div>
          </div>

          {/* Bouncing dots */}
          <div className="mt-8 flex items-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    i === 0
                      ? "#1a2b6b"
                      : i === 1
                        ? "#f97316"
                        : i === 2
                          ? "#1a2b6b"
                          : "#f97316",
                  opacity: 0.7 + i * 0.1,
                }}
              />
            ))}
          </div>

          {/* Label */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="mt-4 text-sm font-medium text-gray-500 tracking-wide"
          >
            Loading…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
