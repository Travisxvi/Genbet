export interface Market {
  id: string;
  title: string;
  description: string;
  evidence_url: string;
  category: string;
  creator: string;
  creator_fee_pct: number;
  deadline_ts: number;
  status: "OPEN" | "SETTLED" | "NEEDS_RECHECK" | "REFUNDED";
  outcome: "PENDING" | "YES" | "NO" | "UNCERTAIN" | "ERROR";
  total_yes_stake: number;
  total_no_stake: number;
  creator_fee_earned: number;
  ai_reasoning: string;
  confidence: number;
  recheck_count: number;
}

export interface Position {
  side: "YES" | "NO";
  stake: number;
  claimed: boolean;
  payout: number;
}

export interface LeaderboardEntry {
  address: string;
  wins: number;
  losses: number;
  total_wagered: number;
  total_won: number;
}

export interface PlayerScore {
  wins: number;
  losses: number;
  total_wagered: number;
  total_won: number;
}

export interface TransactionReceipt {
  transactionHash: string;
  status: string;
}
