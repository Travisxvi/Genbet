"use client";

import { useState } from "react";
import {
  Loader2,
  Trophy,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  ExternalLink,
} from "lucide-react";
import { useMarkets, usePlaceBet, useSettleMarket, useGenBetContract, useMyPositions } from "@/lib/hooks/useGenBet";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Market } from "@/lib/contracts/types";

const CATEGORY_COLORS: Record<string, string> = {
  Crypto: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  Sports: "text-green-400 border-green-500/30 bg-green-500/10",
  Politics: "text-red-400 border-red-500/30 bg-red-500/10",
  Tech: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  Other: "text-purple-400 border-purple-500/30 bg-purple-500/10",
};

function OutcomeBadge({ outcome, status }: { outcome: string; status: string }) {
  if (status === "OPEN") {
    return <span className="badge-open"><Clock className="w-3 h-3" />Open</span>;
  }
  if (status === "NEEDS_RECHECK") {
    return <span className="badge-pending"><RefreshCw className="w-3 h-3" />Recheck</span>;
  }
  if (status === "REFUNDED") {
    return <span className="badge-pending">Refunded</span>;
  }
  if (outcome === "YES") {
    return <span className="badge-yes"><CheckCircle2 className="w-3 h-3" />YES</span>;
  }
  if (outcome === "NO") {
    return <span className="badge-no"><XCircle className="w-3 h-3" />NO</span>;
  }
  return <span className="badge-pending">{outcome}</span>;
}

function OddsBar({ yesStake, noStake }: { yesStake: number; noStake: number }) {
  const total = yesStake + noStake;
  if (total === 0) {
    return <div className="odds-bar"><div className="flex-1 bg-white/5" /></div>;
  }
  const yesPct = Math.round((yesStake / total) * 100);
  return (
    <div className="odds-bar">
      <div className="odds-bar-yes" style={{ width: `${yesPct}%` }} />
      <div className="odds-bar-no" />
    </div>
  );
}

interface MarketRowProps {
  market: Market;
  address: string | null;
  isConnected: boolean;
  onSettle: (id: string) => void;
  isSettling: boolean;
}

function MarketRow({ market, address, isConnected, onSettle, isSettling }: MarketRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [betSide, setBetSide] = useState<"YES" | "NO">("YES");
  const [stake, setStake] = useState(100);
  const { placeBet, isPlacing, placingMarketId } = usePlaceBet();

  const total = market.total_yes_stake + market.total_no_stake;
  const yesPct = total > 0 ? Math.round((market.total_yes_stake / total) * 100) : 50;
  const noPct = 100 - yesPct;
  const isOpen = market.status === "OPEN" || market.status === "NEEDS_RECHECK";
  const isThisPlacing = isPlacing && placingMarketId === market.id;

  const handleBet = () => {
    if (!isConnected || !address) {
      error("Please connect your wallet first");
      return;
    }
    if (stake <= 0) {
      error("Stake must be greater than 0");
      return;
    }
    placeBet({ marketId: market.id, side: betSide, stake });
  };

  const handleSettle = () => {
    if (!isConnected || !address) {
      error("Please connect your wallet first");
      return;
    }
    if (confirm("Trigger AI settlement for this market? GenLayer validators will fetch the evidence URL and determine the outcome.")) {
      onSettle(market.id);
    }
  };

  return (
    <div className="group border border-white/8 rounded-xl bg-white/3 hover:bg-white/5 transition-all overflow-hidden flex flex-col h-full">
      {/* Main row */}
      <div
        className="flex flex-col gap-3 p-4 cursor-pointer flex-1"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Category badge & Status */}
        <div className="flex justify-between items-start">
          <Badge
            variant="outline"
            className={`text-xs ${CATEGORY_COLORS[market.category] || CATEGORY_COLORS.Other}`}
          >
            {market.category}
          </Badge>
          <OutcomeBadge outcome={market.outcome} status={market.status} />
        </div>

        {/* Title + metadata */}
        <div className="flex-1">
          <p className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-slate-900 dark:text-gray-100">{market.title}</p>
          <div className="flex items-center gap-3 mt-3">
            <OddsBar yesStake={market.total_yes_stake} noStake={market.total_no_stake} />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-mono text-xs text-green-400">{yesPct}% YES</span>
            <span className="font-mono text-xs text-red-400">{noPct}% NO</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-muted-foreground border-t border-slate-200 dark:border-white/5 pt-3">
            <span>Pool: <span className="font-mono text-slate-900 dark:text-foreground font-semibold">{total}</span></span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <AddressDisplay address={market.creator} maxLength={6} showCopy={false} />
            </span>
            {market.creator_fee_pct > 0 && (
              <>
                <span>·</span>
                <span>Fee {market.creator_fee_pct}%</span>
              </>
            )}
          </div>
          
          <div className="flex justify-center mt-2 border-t border-white/5 pt-2">
             <button className="text-muted-foreground w-full flex justify-center hover:text-white transition-colors py-1">
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 p-4 space-y-4 animate-fade-in mt-auto">
          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Resolution condition
            </p>
            <p className="text-sm">{market.description}</p>
          </div>

          {/* Evidence URL */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Evidence URL
            </p>
            <a
              href={market.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline flex items-center gap-1 break-all"
            >
              {market.evidence_url}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          {/* AI reasoning (if settled) */}
          {market.ai_reasoning && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                AI reasoning {market.confidence > 0 && `(${market.confidence}% confidence)`}
              </p>
              <p className="text-sm italic text-muted-foreground">"{market.ai_reasoning}"</p>
            </div>
          )}

          {/* Bet controls (only when open) */}
          {isOpen && isConnected && (
            <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider">Place Your Bet</p>
              {/* YES / NO toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBetSide("YES")}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-bold ${
                    betSide === "YES"
                      ? "bg-pink-500 text-white hover:bg-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] border-transparent dark:bg-green-500/20 dark:text-green-400 dark:border-green-500 dark:shadow-none"
                      : "border-slate-200 hover:border-slate-300 text-slate-500 dark:border-white/10 dark:hover:border-white/20 dark:text-muted-foreground"
                  }`}
                >
                  ✅ YES · {yesPct}%
                </button>
                <button
                  type="button"
                  onClick={() => setBetSide("NO")}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-bold ${
                    betSide === "NO"
                      ? "bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] border-transparent dark:bg-red-500/20 dark:text-red-400 dark:border-red-500 dark:shadow-none"
                      : "border-slate-200 hover:border-slate-300 text-slate-500 dark:border-white/10 dark:hover:border-white/20 dark:text-muted-foreground"
                  }`}
                >
                  ❌ NO · {noPct}%
                </button>
              </div>
              {/* Stake */}
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={stake}
                  onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                  className="flex-1 bg-white border-gray-300 text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  placeholder="Stake amount"
                />
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleBet}
                  disabled={isThisPlacing}
                >
                  {isThisPlacing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Placing...
                    </>
                  ) : (
                    `Bet ${betSide}`
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Settle button (open markets only) */}
          {isOpen && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSettle}
                disabled={isSettling}
                className="text-xs gap-1"
              >
                {isSettling ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Settling...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-accent" />
                    Settle with AI
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FILTER_CATEGORIES = ["All", "Crypto", "Sports", "Politics", "Tech", "Other", "My Creations", "My Wagers"] as const;
type FilterCategory = (typeof FILTER_CATEGORIES)[number];

export function MarketsTable() {
  const contract = useGenBetContract();
  const { data: markets, isLoading, isError } = useMarkets();
  const { data: myPositions = [], isLoading: isLoadingPositions } = useMyPositions();
  const { address, isConnected } = useWallet();
  const { settleMarket, isSettling, settlingMarketId } = useSettleMarket();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("All");

  if (isLoading) {
    return (
      <div className="brand-card p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading markets...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 opacity-60" />
          <h3 className="text-xl font-bold">Setup Required</h3>
          <p className="text-muted-foreground">
            Set <code className="bg-muted px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in your <code className="bg-muted px-1 py-0.5 rounded text-xs">.env</code> file.
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="brand-card p-8 text-center">
        <p className="text-destructive">Failed to load markets. Please try again.</p>
      </div>
    );
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-3">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h3 className="text-xl font-bold">No Markets Yet</h3>
          <p className="text-muted-foreground">
            Be the first to create a prediction market!
          </p>
        </div>
      </div>
    );
  }

  let filteredMarkets = markets;
  
  if (activeCategory === "My Creations") {
    filteredMarkets = markets.filter((m) => address && m.creator.toLowerCase() === address.toLowerCase());
  } else if (activeCategory === "My Wagers") {
    filteredMarkets = markets.filter((m) => myPositions.includes(m.id));
  } else if (activeCategory !== "All") {
    filteredMarkets = markets.filter((m) => m.category === activeCategory);
  }

  // To display the skeleton loaders if fetching positions
  const isFetchingMyData = (activeCategory === "My Wagers") && isLoadingPositions;

  return (
    <div className="brand-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pb-1">
        <h2 className="text-lg font-bold">Active Markets</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {filteredMarkets.length} / {markets.length} markets
        </span>
      </div>

      {/* ── Category Filter Bar ── */}
      <div className="flex items-center gap-2 px-2 pb-1 overflow-x-auto scrollbar-none">
        {FILTER_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={[
                "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold",
                "border transition-all duration-200 cursor-pointer select-none",
                isActive
                  ? "bg-cyan-50 border border-cyan-400 text-cyan-700 shadow-sm font-medium dark:text-[#00D4FF] dark:bg-[#00D4FF]/10 dark:border-[#00D4FF]/30 dark:shadow-[0_0_10px_rgba(0,212,255,0.15)]"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm dark:bg-transparent dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/5",
              ].join(" ")}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Market List ── */}
      {isFetchingMyData ? (
        <div className="py-10 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#00D4FF]" />
        </div>
      ) : filteredMarkets.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-sm text-muted-foreground">No {activeCategory} markets found.</p>
          <p className="text-xs text-muted-foreground/60">Create one or participate in active markets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 mt-4 gap-4">
          {filteredMarkets.map((market) => (
            <MarketRow
              key={market.id}
              market={market}
              address={address}
              isConnected={isConnected}
              onSettle={settleMarket}
              isSettling={isSettling && settlingMarketId === market.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
