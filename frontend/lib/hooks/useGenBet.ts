"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import GenBet from "../contracts/GenBet";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Market, LeaderboardEntry, PlayerScore } from "../contracts/types";

/**
 * Hook to get the GenBet contract instance
 */
export function useGenBetContract(): GenBet | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.",
        {
          label: "Setup Guide",
          onClick: () => window.open("/docs/setup", "_blank"),
        }
      );
      return null;
    }
    return new GenBet(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

/**
 * Hook to fetch all markets
 */
export function useMarkets() {
  const contract = useGenBetContract();

  return useQuery<Market[], Error>({
    queryKey: ["markets"],
    queryFn: () => {
      if (!contract) return Promise.resolve([]);
      return contract.getMarkets();
    },
    refetchOnWindowFocus: true,
    staleTime: 3000,
    enabled: !!contract,
  });
}

/**
 * Hook to fetch a single market
 */
export function useMarket(marketId: string | null) {
  const contract = useGenBetContract();

  return useQuery<Market | null, Error>({
    queryKey: ["market", marketId],
    queryFn: () => {
      if (!contract || !marketId) return Promise.resolve(null);
      return contract.getMarket(marketId);
    },
    enabled: !!contract && !!marketId,
    staleTime: 3000,
  });
}

/**
 * Hook to fetch the leaderboard (top 10 by total_won)
 */
export function useLeaderboard() {
  const contract = useGenBetContract();

  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: () => {
      if (!contract) return Promise.resolve([]);
      return contract.getLeaderboard();
    },
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled: !!contract,
  });
}

/**
 * Hook to fetch a player's score
 */
export function usePlayerScore(address: string | null) {
  const contract = useGenBetContract();

  return useQuery<PlayerScore, Error>({
    queryKey: ["playerScore", address],
    queryFn: () => {
      if (!contract || !address)
        return Promise.resolve({ wins: 0, losses: 0, total_wagered: 0, total_won: 0 });
      return contract.getPlayerScore(address);
    },
    enabled: !!contract && !!address,
    staleTime: 3000,
  });
}

/**
 * Hook to fetch all market IDs that the current user has bet on
 */
export function useMyPositions() {
  const contract = useGenBetContract();
  const { address } = useWallet();
  const { data: markets } = useMarkets();

  return useQuery({
    queryKey: ["my-positions", address],
    queryFn: async () => {
      if (!contract || !address || !markets) return [];
      
      const participatedMarketIds = new Set<string>();
      
      // Batch our requests (could use Promise.all but we don't want to crash RPC if there are 100 markets)
      // Since it's local testnet, Promise.all is fine for 50 markets
      const positionPromises = markets.map(async (m) => {
        const positions = await contract.getPositions(m.id);
        if (positions) {
          const hasParticipated = Object.keys(positions).some(k => k.toLowerCase() === address.toLowerCase());
          if (hasParticipated) return m.id;
        }
        return null;
      });
      
      const results = await Promise.all(positionPromises);
      results.forEach(id => {
        if (id) participatedMarketIds.add(id);
      });
      
      return Array.from(participatedMarketIds);
    },
    enabled: !!contract && !!address && !!markets && markets.length > 0,
    staleTime: 60000,
  });
}

/**
 * Hook to create a new prediction market
 */
export function useCreateMarket() {
  const contract = useGenBetContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      title,
      description,
      evidenceUrl,
      category,
      creatorFeePct,
      deadlineTs,
    }: {
      title: string;
      description: string;
      evidenceUrl: string;
      category: string;
      creatorFeePct: number;
      deadlineTs: number;
    }) => {
      if (!contract)
        throw new Error("Contract not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env file.");
      if (!address)
        throw new Error("Wallet not connected. Please connect your wallet.");
      setIsCreating(true);
      return contract.createMarket(
        title,
        description,
        evidenceUrl,
        category,
        address,
        creatorFeePct,
        deadlineTs
      );
    },
    onSuccess: (receipt) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setIsCreating(false);
      
      const shortHash = receipt?.transactionHash 
        ? `${receipt.transactionHash.slice(0, 8)}...${receipt.transactionHash.slice(-6)}` 
        : "";

      success("Market created!", {
        description: `Tx Hash: ${shortHash}`,
      });
    },
    onError: (err: any) => {
      setIsCreating(false);
      error("Failed to create market", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isCreating,
    createMarket: mutation.mutate,
    createMarketAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to place a YES/NO bet on a market
 */
export function usePlaceBet() {
  const contract = useGenBetContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isPlacing, setIsPlacing] = useState(false);
  const [placingMarketId, setPlacingMarketId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      marketId,
      side,
      stake,
    }: {
      marketId: string;
      side: "YES" | "NO";
      stake: number;
    }) => {
      if (!contract)
        throw new Error("Contract not configured.");
      if (!address)
        throw new Error("Wallet not connected.");
      setIsPlacing(true);
      setPlacingMarketId(marketId);
      return contract.placeBet(marketId, address, side, stake);
    },
    onSuccess: (receipt) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["playerScore"] });
      queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      setIsPlacing(false);
      setPlacingMarketId(null);

      const shortHash = receipt?.transactionHash 
        ? `${receipt.transactionHash.slice(0, 8)}...${receipt.transactionHash.slice(-6)}` 
        : "";

      success("Bet placed!", {
        description: `Tx Hash: ${shortHash}`,
      });
    },
    onError: (err: any) => {
      setIsPlacing(false);
      setPlacingMarketId(null);
      error("Failed to place bet", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isPlacing,
    placingMarketId,
    placeBet: mutation.mutate,
    placeBetAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to trigger AI settlement of a market
 */
export function useSettleMarket() {
  const contract = useGenBetContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isSettling, setIsSettling] = useState(false);
  const [settlingMarketId, setSettlingMarketId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (marketId: string) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      const now = Math.floor(Date.now() / 1000);
      setIsSettling(true);
      setSettlingMarketId(marketId);
      return contract.settleMarket(marketId, now);
    },
    onSuccess: (receipt) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["playerScore"] });
      setIsSettling(false);
      setSettlingMarketId(null);

      const shortHash = receipt?.transactionHash 
        ? `${receipt.transactionHash.slice(0, 8)}...${receipt.transactionHash.slice(-6)}` 
        : "";

      success("Market settled by AI!", {
        description: `Tx Hash: ${shortHash}`,
      });
    },
    onError: (err: any) => {
      setIsSettling(false);
      setSettlingMarketId(null);
      error("Failed to settle market", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isSettling,
    settlingMarketId,
    settleMarket: mutation.mutate,
    settleMarketAsync: mutation.mutateAsync,
  };
}
