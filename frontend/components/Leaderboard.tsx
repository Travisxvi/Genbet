"use client";

import { Trophy, Medal, Award, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { useLeaderboard, usePlayerScore, useGenBetContract } from "@/lib/hooks/useGenBet"
import { useWallet } from "@/lib/genlayer/wallet"
import { AddressDisplay } from "./AddressDisplay"
import { Badge } from "./ui/badge"

export function Leaderboard() {
  const contract = useGenBetContract();
  const { data: leaderboard, isLoading, isError } = useLeaderboard();
  const { address } = useWallet();
  const { data: myScore } = usePlayerScore(address);

  if (isLoading) {
    return (
      <div className="brand-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Leaderboard
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="brand-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Leaderboard
        </h2>
        <div className="text-center py-8 space-y-3">
          <AlertCircle className="w-12 h-12 mx-auto text-yellow-400 opacity-60" />
          <p className="text-sm text-muted-foreground">Contract address not configured</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="brand-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Leaderboard
        </h2>
        <p className="text-sm text-destructive text-center py-8">Failed to load leaderboard</p>
      </div>
    );
  }

  return (
    <div className="brand-card p-6 space-y-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#00D4FF]" />
          <span className="text-gradient">Leaderboard</span>
        </h2>
        <Badge variant="outline" className="text-[10px] font-mono border-gray-300 dark:border-white/10 uppercase tracking-wider text-gray-500 dark:text-muted-foreground">
          Top 10
        </Badge>
      </div>

      {/* My stats bar */}
      {address && myScore && (myScore.wins > 0 || myScore.losses > 0) && (
        <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl p-3.5 space-y-2">
          <p className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.15em]">Your Performance</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">Win / Loss</span>
              <p className="font-mono font-bold text-sm mt-0.5">
                <span className="text-green-400">{myScore.wins}W</span>{" — "}
                <span className="text-red-400">{myScore.losses}L</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">Total Won</span>
              <p className="font-mono font-bold text-sm text-[#00D4FF] mt-0.5">
                {myScore.total_won} <span className="text-[10px] font-normal text-muted-foreground">pts</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rankings */}
      {!leaderboard || leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
          <p className="text-sm text-muted-foreground">No winners yet</p>
          <p className="text-xs text-muted-foreground">Be the first to win a market!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = address?.toLowerCase() === entry.address?.toLowerCase();
            const rank = index + 1;
            const winRate =
              entry.wins + entry.losses > 0
                ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
                : 0;

            return (
              <div
                key={entry.address}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCurrentUser
                    ? "bg-[#00D4FF]/10 border-2 border-[#00D4FF]/40 dark:bg-[#00D4FF]/20 dark:border-[#00D4FF]/50"
                    : "hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {/* Rank icon */}
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {rank === 1 && <Trophy className="w-5 h-5 text-yellow-400" />}
                  {rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                  {rank === 3 && <Award className="w-5 h-5 text-amber-600" />}
                  {rank > 3 && (
                    <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
                  )}
                </div>

                {/* Address + win rate */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AddressDisplay
                      address={entry.address}
                      maxLength={10}
                      className="text-sm"
                      showCopy={true}
                    />
                    {isCurrentUser && (
                      <span className="text-xs bg-accent/30 text-accent px-2 py-0.5 rounded-full font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.wins}W · {entry.losses}L · {winRate}% win rate
                  </p>
                </div>

                {/* Total won */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="font-mono text-lg font-bold text-[#00D4FF]">{entry.total_won}</span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">won</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leaderboard && leaderboard.length >= 10 && (
        <p className="text-xs text-center text-muted-foreground">Showing top 10 players</p>
      )}
    </div>
  );
}
