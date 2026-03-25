"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const MIN_VISIBLE_MS = 700; // always show bar for at least this long

export function PageLoader({ show }: { show: boolean }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const showStartRef = useRef<number>(0);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    clearTimers();

    if (show) {
      showStartRef.current = Date.now();
      setWidth(0);
      setVisible(true);
      const t1 = setTimeout(() => setWidth(20), 20);
      const t2 = setTimeout(() => setWidth(50), 200);
      const t3 = setTimeout(() => setWidth(72), 600);
      const t4 = setTimeout(() => setWidth(85), 1400);
      timersRef.current = [t1, t2, t3, t4];
    } else {
      // Respect minimum visible duration so fast pages still show the bar clearly
      const elapsed = Date.now() - showStartRef.current;
      const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

      const finish = () => {
        setWidth(100);
        const tFade = setTimeout(() => {
          setVisible(false);
          setWidth(0);
        }, 350);
        timersRef.current = [tFade];
      };

      if (delay > 0) {
        const tWait = setTimeout(finish, delay);
        timersRef.current = [tWait];
      } else {
        finish();
      }
    }

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[4px] pointer-events-none overflow-hidden">
      <div
        className="h-full rounded-r-full"
        style={{
          width: `${width}%`,
          background:
            "linear-gradient(90deg, #1a2b6b 0%, #3b5bdb 40%, #f97316 100%)",
          boxShadow:
            "0 0 10px rgba(249,115,22,0.7), 0 0 4px rgba(26,43,107,0.4)",
          transition:
            width === 100
              ? "width 0.25s ease-out"
              : width <= 20
                ? "width 0.15s ease-out"
                : "width 0.9s ease-out",
        }}
      />
      {/* Glowing tip dot */}
      {show && width > 0 && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-orange-500"
          style={{
            left: `calc(${width}% - 6px)`,
            boxShadow: "0 0 8px 2px rgba(249,115,22,0.8)",
          }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        />
      )}
    </div>
  );
}
