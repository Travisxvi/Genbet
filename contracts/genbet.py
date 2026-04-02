# v0.1.0
# { "Depends": "py-genlayer:latest" }
from genlayer import *

import json


class GenBet(gl.Contract):
    market_count: u256
    market_data: str     # JSON: {market_id: {market fields}}
    positions_data: str  # JSON: {market_id: {address: {side, stake, payout, claimed}}}
    scores_data: str     # JSON: {address: {wins, losses, total_wagered, total_won}}

    def __init__(self):
        self.market_count = u256(0)
        self.market_data = "{}"
        self.positions_data = "{}"
        self.scores_data = "{}"

    # ─── CREATE MARKET ────────────────────────────────────────────────────────

    @gl.public.write
    def create_market(
        self,
        title: str,
        description: str,
        evidence_url: str,
        category: str,
        creator_address: str,
        creator_fee_pct: u256,
        deadline_ts: u256,
    ) -> None:
        """Create a prediction market on any real-world event.
        category: 'Crypto' | 'Sports' | 'Politics' | 'Tech' | 'Other'
        creator_fee_pct: 0-10 (percentage of pot taken by creator, e.g. 3 = 3%)
        deadline_ts: unix timestamp — settle_market will reject calls before this"""
        market_id = str(self.market_count)

        assert int(creator_fee_pct) <= 10, "Creator fee cannot exceed 10%"
        assert category in ["Crypto", "Sports", "Politics", "Tech", "Other"], \
            "Invalid category"

        all_markets = json.loads(self.market_data)
        all_positions = json.loads(self.positions_data)

        all_markets[market_id] = {
            "id": market_id,
            "title": title,
            "description": description,
            "evidence_url": evidence_url,
            "category": category,
            "creator": creator_address,
            "creator_fee_pct": int(creator_fee_pct),
            "deadline_ts": int(deadline_ts),
            "status": "OPEN",        # OPEN → SETTLED | NEEDS_RECHECK | REFUNDED
            "outcome": "PENDING",    # PENDING → YES | NO | UNCERTAIN
            "total_yes_stake": 0,
            "total_no_stake": 0,
            "creator_fee_earned": 0,
            "ai_reasoning": "",
            "confidence": 0,
            "recheck_count": 0,
        }
        all_positions[market_id] = {}

        self.market_data = json.dumps(all_markets)
        self.positions_data = json.dumps(all_positions)
        self.market_count += u256(1)

    # ─── PLACE BET ────────────────────────────────────────────────────────────

    @gl.public.write
    def place_bet(
        self,
        market_id: str,
        bettor_address: str,
        side: str,
        stake: u256,
    ) -> None:
        """Stake on YES or NO for an open market.
        Cannot place bet after deadline or once market is settled.
        Cannot switch sides after placing a bet."""
        all_markets = json.loads(self.market_data)
        all_positions = json.loads(self.positions_data)

        market = all_markets.get(market_id)
        if not market:
            return

        if market["status"] != "OPEN":
            return

        assert side in ["YES", "NO"], "Side must be YES or NO"
        assert int(stake) > 0, "Stake must be greater than 0"

        positions = all_positions.get(market_id, {})
        existing = positions.get(bettor_address)

        if existing and existing["side"] != side:
            return  # Cannot switch sides

        if existing:
            positions[bettor_address]["stake"] += int(stake)
        else:
            positions[bettor_address] = {
                "side": side,
                "stake": int(stake),
                "claimed": False,
                "payout": 0,
            }

        if side == "YES":
            market["total_yes_stake"] += int(stake)
        else:
            market["total_no_stake"] += int(stake)

        all_markets[market_id] = market
        all_positions[market_id] = positions

        self.market_data = json.dumps(all_markets)
        self.positions_data = json.dumps(all_positions)

    # ─── SETTLE MARKET ────────────────────────────────────────────────────────

    @gl.public.write
    def settle_market(self, market_id: str, caller_ts: u256) -> None:
        """Trigger GenLayer AI consensus to settle the market.
        - Requires current time >= deadline_ts.
        - If AI confidence < 60, market is flagged NEEDS_RECHECK (max 3 attempts).
        - After 3 UNCERTAIN results, all bettors are fully refunded.
        - Winners split the pot minus the creator fee, proportional to stake.
        - Losers get nothing.
        - Win/loss scores are updated for the leaderboard."""
        all_markets = json.loads(self.market_data)
        all_positions = json.loads(self.positions_data)
        all_scores = json.loads(self.scores_data)

        market = all_markets.get(market_id)
        if not market:
            return

        if market["status"] not in ["OPEN", "NEEDS_RECHECK"]:
            return

        # ── Deadline gate ─────────────────────────────────────────────────────
        if int(caller_ts) < market["deadline_ts"]:
            return  # Too early — event hasn't had time to complete

        url = market["evidence_url"]
        description = market["description"]

        def evaluate_market() -> str:
            try:
                content = gl.nondet.web.render(url, mode="text")
            except Exception as e:
                return json.dumps({
                    "outcome": "UNCERTAIN",
                    "reasoning": f"Failed to fetch evidence URL: {str(e)}",
                    "confidence": 0
                })

            prompt = f"""You are GenBet, a decentralized prediction market resolver.
Read the webpage and determine whether the event described has occurred (YES) or not (NO).

MARKET QUESTION:
{description}

EVIDENCE WEBPAGE CONTENT ({url}):
{content[:4000]}

Based ONLY on the webpage content above, has the event occurred?
Respond with ONLY this JSON:
{{
    "outcome": "YES" or "NO" or "UNCERTAIN",
    "reasoning": "one clear sentence citing specific evidence from the page",
    "confidence": integer between 0 and 100
}}
Your output must be valid JSON only. No extra text, no markdown formatting.
If the page does not contain enough information to be certain, use UNCERTAIN.
"""
            try:
                result_text = gl.nondet.exec_prompt(prompt)
                result_text = result_text.replace("```json", "").replace("```", "").strip()
                return result_text
            except Exception as e:
                return json.dumps({
                    "outcome": "UNCERTAIN",
                    "reasoning": f"AI execution failed: {str(e)}",
                    "confidence": 0
                })

        result_json_str = gl.eq_principle.prompt_comparative(
            evaluate_market,
            "The value of outcome has to match"
        )

        try:
            parsed = json.loads(result_json_str)
            outcome = parsed.get("outcome", "UNCERTAIN")
            confidence = int(parsed.get("confidence", 0))
            assert outcome in ["YES", "NO", "UNCERTAIN"]

            market["ai_reasoning"] = parsed.get("reasoning", "No reasoning provided.")
            market["confidence"] = confidence

            # ── Confidence gate ───────────────────────────────────────────────
            if confidence < 60 or outcome == "UNCERTAIN":
                market["recheck_count"] += 1
                if market["recheck_count"] >= 3:
                    # 3 strikes — full refund to everyone
                    market["status"] = "REFUNDED"
                    market["outcome"] = "UNCERTAIN"
                    positions = all_positions.get(market_id, {})
                    for addr, pos in positions.items():
                        pos["payout"] = pos["stake"]  # Full refund
                        pos["claimed"] = True
                    all_positions[market_id] = positions
                else:
                    market["status"] = "NEEDS_RECHECK"
                    market["outcome"] = "UNCERTAIN"

                all_markets[market_id] = market
                self.market_data = json.dumps(all_markets)
                self.positions_data = json.dumps(all_positions)
                self.scores_data = json.dumps(all_scores)
                return

            # ── Confident outcome — pay out winners ───────────────────────────
            market["outcome"] = outcome
            market["status"] = "SETTLED"

            total_pot = market["total_yes_stake"] + market["total_no_stake"]
            positions = all_positions.get(market_id, {})

            if total_pot > 0:
                # Deduct creator fee
                fee_pct = market["creator_fee_pct"]
                creator_fee = int(total_pot * fee_pct / 100)
                distributable = total_pot - creator_fee
                market["creator_fee_earned"] = creator_fee

                winning_side_total = (
                    market["total_yes_stake"] if outcome == "YES"
                    else market["total_no_stake"]
                )

                for addr, pos in positions.items():
                    # ── Update leaderboard scores ──────────────────────────
                    if addr not in all_scores:
                        all_scores[addr] = {
                            "wins": 0,
                            "losses": 0,
                            "total_wagered": 0,
                            "total_won": 0,
                        }
                    score = all_scores[addr]
                    score["total_wagered"] += pos["stake"]

                    if pos["side"] == outcome and winning_side_total > 0:
                        # Winner: proportional share of distributable pot
                        share = pos["stake"] / winning_side_total
                        payout = int(distributable * share)
                        pos["payout"] = payout
                        pos["claimed"] = True
                        score["wins"] += 1
                        score["total_won"] += payout
                    else:
                        # Loser: nothing
                        pos["payout"] = 0
                        pos["claimed"] = True
                        score["losses"] += 1

                    all_scores[addr] = score

            all_positions[market_id] = positions

        except Exception as e:
            market["outcome"] = "ERROR"
            market["ai_reasoning"] = f"Failed to parse AI consensus: {str(e)}"
            market["status"] = "SETTLED"

        all_markets[market_id] = market
        self.market_data = json.dumps(all_markets)
        self.positions_data = json.dumps(all_positions)
        self.scores_data = json.dumps(all_scores)

    # ─── VIEW FUNCTIONS ───────────────────────────────────────────────────────

    @gl.public.view
    def get_market_data(self) -> str:
        """Returns all markets as JSON."""
        return self.market_data

    @gl.public.view
    def get_market_count(self) -> u256:
        return self.market_count

    @gl.public.view
    def get_market(self, market_id: str) -> str:
        """Returns a single market as JSON."""
        all_markets = json.loads(self.market_data)
        return json.dumps(all_markets.get(market_id, {}))

    @gl.public.view
    def get_positions(self, market_id: str) -> str:
        """Returns all positions for a market as JSON."""
        all_positions = json.loads(self.positions_data)
        return json.dumps(all_positions.get(market_id, {}))

    @gl.public.view
    def get_leaderboard(self) -> str:
        """Returns top 10 bettors sorted by total_won descending."""
        all_scores = json.loads(self.scores_data)
        sorted_scores = sorted(
            [{"address": addr, **data} for addr, data in all_scores.items()],
            key=lambda x: x["total_won"],
            reverse=True
        )
        return json.dumps(sorted_scores[:10])

    @gl.public.view
    def get_player_score(self, address: str) -> str:
        """Returns win/loss record and earnings for a specific address."""
        all_scores = json.loads(self.scores_data)
        return json.dumps(all_scores.get(address, {
            "wins": 0,
            "losses": 0,
            "total_wagered": 0,
            "total_won": 0,
        }))
