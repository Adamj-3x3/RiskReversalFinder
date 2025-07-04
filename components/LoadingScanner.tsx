import React from "react";

export const LoadingScanner: React.FC = () => (
  <div className="relative w-full h-40 flex items-center justify-center bg-zinc-950/80 rounded-xl overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-400/40 to-transparent animate-scanner" />
    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#23304a_0_2px,transparent_2px_40px)] opacity-40" />
    <div className="z-10 text-lime-400 font-mono text-lg animate-pulse">Scanning market data...</div>
    <style>{`
      @keyframes scanner {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      .animate-scanner {
        position: absolute;
        top: 0; left: 0; height: 100%; width: 40%;
        animation: scanner 1.5s linear infinite;
        filter: blur(4px) brightness(1.5);
      }
    `}</style>
  </div>
); 