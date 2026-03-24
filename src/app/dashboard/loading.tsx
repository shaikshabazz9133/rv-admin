import { Tent } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="relative flex items-center justify-center">
        {/* CSS-only rings (no framer-motion — this is RSC) */}
        <div className="absolute h-20 w-20 animate-spin rounded-full border-[3px] border-transparent border-t-[#1a2b6b] border-r-[#1a2b6b]/40" />
        <div
          className="absolute h-14 w-14 animate-spin rounded-full border-[3px] border-transparent border-t-orange-500 border-r-orange-300"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a2b6b] shadow-lg">
          <Tent className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="mt-8 flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-[#1a2b6b] animate-bounce"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <p className="mt-4 text-sm font-medium text-gray-400 tracking-wide animate-pulse">
        Loading…
      </p>
    </div>
  );
}
