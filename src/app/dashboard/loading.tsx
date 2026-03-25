export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-[4px] pointer-events-none overflow-hidden">
      <div
        className="h-full w-3/4 animate-pulse rounded-r-full"
        style={{
          background:
            "linear-gradient(90deg, #1a2b6b 0%, #3b5bdb 40%, #f97316 100%)",
          boxShadow:
            "0 0 10px rgba(249,115,22,0.7), 0 0 4px rgba(26,43,107,0.4)",
        }}
      />
    </div>
  );
}
