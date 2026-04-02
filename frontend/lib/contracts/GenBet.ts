import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Market, LeaderboardEntry, PlayerScore, TransactionReceipt } from "./types";

/**
 * GenBet contract class for interacting with the GenLayer GenBet Intelligent Contract
 */
class GenBet {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };
    this.client = createClient(config);
  }

  // ── Read: all markets ────────────────────────────────────────────────────
  async getMarkets(): Promise<Market[]> {
    try {
      const raw: any = await this.readClient.readContract({
        address: this.contractAddress,
        functionName: "get_market_data",
        args: [],
      });
      const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      return Object.values(parsed) as Market[];
    } catch (error) {
      console.error("Error fetching markets data:", error);
      return [];
    }
  }

  // ── Read: single market ──────────────────────────────────────────────────
  async getMarket(marketId: string): Promise<Market | null> {
    try {
      const raw: any = await this.readClient.readContract({
        address: this.contractAddress,
        functionName: "get_market",
        args: [marketId],
      });
      const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      if (!parsed || !parsed.id) return null;
      return parsed as Market;
    } catch (error) {
      console.error("Error fetching market:", error);
      return null;
    }
  }

  // ── Read: market count ───────────────────────────────────────────────────
  async getMarketCount(): Promise<number> {
    try {
      const count: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_market_count",
        args: [],
      });
      return Number(count) || 0;
    } catch {
      return 0;
    }
  }

  // ── Read: positions ──────────────────────────────────────────────────────
  async getPositions(marketId: string): Promise<Record<string, any>> {
    try {
      const raw: any = await this.readClient.readContract({
        address: this.contractAddress,
        functionName: "get_positions",
        args: [marketId],
      });
      const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      return parsed; // Key is bettor address
    } catch {
      return {};
    }
  }

  // ── Read: leaderboard ────────────────────────────────────────────────────
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const raw: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_leaderboard",
        args: [],
      });
      const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  // ── Read: player score ───────────────────────────────────────────────────
  async getPlayerScore(address: string): Promise<PlayerScore> {
    try {
      const raw: any = await this.readClient.readContract({
        address: this.contractAddress,
        functionName: "get_player_score",
        args: [address],
      });
      const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      return parsed as PlayerScore;
    } catch {
      return { wins: 0, losses: 0, total_wagered: 0, total_won: 0 };
    }
  }

  // ── Write: create market ─────────────────────────────────────────────────
  async createMarket(
    title: string,
    description: string,
    evidenceUrl: string,
    category: string,
    creatorAddress: string,
    creatorFeePct: number,
    deadlineTs: number
  ): Promise<TransactionReceipt> {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "create_market",
      args: [title, description, evidenceUrl, category, creatorAddress, creatorFeePct, deadlineTs],
      value: BigInt(0),
    });

    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED" as any,
      retries: 30,
      interval: 5000,
    });

    return receipt as TransactionReceipt;
  }

  // ── Write: place bet ─────────────────────────────────────────────────────
  async placeBet(
    marketId: string,
    bettorAddress: string,
    side: "YES" | "NO",
    stake: number
  ): Promise<TransactionReceipt> {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "place_bet",
      args: [marketId, bettorAddress, side, stake],
      value: BigInt(0),
    });

    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED" as any,
      retries: 30,
      interval: 5000,
    });

    return receipt as TransactionReceipt;
  }

  // ── Write: settle market ─────────────────────────────────────────────────
  async settleMarket(
    marketId: string,
    callerTs: number
  ): Promise<TransactionReceipt> {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "settle_market",
      args: [marketId, callerTs],
      value: BigInt(0),
    });

    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED" as any,
      retries: 60,
      interval: 5000,
    });

    return receipt as TransactionReceipt;
  }
}

export default GenBet;
