"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MarketsTable } from "@/components/MarketsTable";
import { Leaderboard } from "@/components/Leaderboard";

export default function HomePage() {
  const [typedText, setTypedText] = useState("");
  const fullText = "Welcome to GenBet.....";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setTypedText(fullText.substring(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-slate-900 dark:text-white h-[1.2em]">
              {typedText}
              <span className="animate-pulse border-r-2 border-primary ml-1"></span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '1s' }}>
              AI-powered prediction markets on GenLayer.
              <br />
              Create markets, stake on outcomes, and let decentralized AI consensus decide.
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column – Markets (67%) */}
            <div className="lg:col-span-8 animate-slide-up">
              <MarketsTable />
            </div>

            {/* Right Column – Leaderboard (33%) */}
            <div className="lg:col-span-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <Leaderboard />
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-8 glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-bold mb-4">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="brand-card p-6 space-y-3 hover:translate-y-[-4px] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] font-bold text-lg">1</div>
              <h3 className="font-bold text-lg">Create a Market</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask any yes/no question about a real-world event. Provide a public evidence URL that AI validators will check at settlement time.
              </p>
            </div>
            <div className="brand-card p-6 space-y-3 hover:translate-y-[-4px] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 font-bold text-lg">2</div>
              <h3 className="font-bold text-lg">Stake YES or NO</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Back your conviction. The more you stake, the larger your potential payout. Odds update in real-time as stakes come in.
              </p>
            </div>
            <div className="brand-card p-6 space-y-3 hover:translate-y-[-4px] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] font-bold text-lg">3</div>
              <h3 className="font-bold text-lg">AI Settles via Consensus</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Multiple GenLayer AI validators independently fetch the evidence URL, reach consensus via the Equivalence Principle, and pay winners automatically.
              </p>
            </div>
          </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Powered by GenLayer
            </a>
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Studio
            </a>
            <a
              href="https://docs.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/genlayerlabs/genlayer-project-boilerplate"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
