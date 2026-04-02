// Polyfill window to bypass the viem/genlayer-js bug in nodejs context
globalThis.window = { ethereum: undefined };

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { createWalletClient, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const CONTRACT_ADDRESS = "0xaE67Ade0cCfB2cFea11BAb5f64dE00C609806ef3";
const account = privateKeyToAccount("0xb87140880ffc7e7343e2009d13dbbb1a0dcca04da64d4b29bb8883508494f1c9"); // Random generated fresh key
const CREATOR = account.address;

const client = createClient({
  chain: studionet,
  account: account,
});

const marketsData = [
  // Crypto
  ["Will BTC stay above $65k today?", "Bitcoin stays above 65000", "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", "Crypto"],
  ["Will ETH flip $3500 tomorrow?", "Ethereum exceeds 3500", "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT", "Crypto"],
  ["Will SOL cross $250 next week?", "Solana cross 250", "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", "Crypto"],
  ["Will DOGE hit $0.20?", "Dogecoin to 20 cents", "https://api.binance.com/api/v3/ticker/price?symbol=DOGEUSDT", "Crypto"],
  ["Will AVAX reach $50?", "Avax to 50", "https://api.binance.com/api/v3/ticker/price?symbol=AVAXUSDT", "Crypto"],

  // Sports
  ["Will Arsenal win the Premier League?", "Arsenal wins PL 2023 2024", "https://v3.football.api-sports.io/standings?league=39&season=2023", "Sports"],
  ["Will Real Madrid win UCL?", "Real Madrid UCL Champions", "https://v3.football.api-sports.io/standings?league=2&season=2023", "Sports"],
  ["Will Lakers make the playoffs?", "LA Lakers Playoffs", "https://data.nba.net/10s/prod/v1/today.json", "Sports"],
  ["Will the Chiefs win the Super Bowl again?", "Kansas City Chiefs SuperBowl", "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard", "Sports"],
  ["Will Verstappen win the next F1 race?", "Max Verstappen F1 winner", "https://ergast.com/api/f1/current/last/results.json", "Sports"],

  // Politics
  ["Will the US pass the Crypto Bill?", "Crypto regulatory bill passed", "https://api.congress.gov/v3/bill", "Politics"],
  ["Will the UK hold elections in May?", "UK May Elections", "https://example.com/uk-politics", "Politics"],
  ["Will the Federal Reserve cut rates?", "Fed cuts interest rates", "https://api.stlouisfed.org/fred/series?series_id=FEDFUNDS", "Politics"],
  ["Will the EU approve AI Act?", "European Union AI Act approval", "https://example.com/eu-ai", "Politics"],
  ["Will local taxes increase the budget?", "City budget tax increase", "https://example.com/local-tax", "Politics"],

  // Tech
  ["Will Apple announce a new VR headset?", "Apple Vision Pro 2", "https://example.com/apple-news", "Tech"],
  ["Will SpaceX launch Starship this month?", "SpaceX Starship orbital launch", "https://api.spacexdata.com/v4/launches/next", "Tech"],
  ["Will OpenAI release GPT-5?", "OpenAI GPT-5 release official", "https://example.com/openai", "Tech"],
  ["Will NVDA stock hit $1000?", "Nvidia stock to 1k", "https://query1.finance.yahoo.com/v8/finance/chart/NVDA", "Tech"],
  ["Will Tesla unveil Model 2?", "Tesla affordable model announcement", "https://example.com/tesla-news", "Tech"],

  // Other
  ["Will it rain in London tomorrow?", "Rain tomorrow in London", "https://wttr.in/London?format=j1", "Other"],
  ["Will a new Taylor Swift album drop?", "Taylor swift album release", "https://example.com/tswift", "Other"],
  ["Will the next Bond actor be announced?", "James Bond casting", "https://example.com/bond", "Other"],
  ["Will the global temperature rise 1C?", "Global warming stat", "https://example.com/climate", "Other"],
  ["Will an alien signal be confirmed?", "SETI signal confirmation", "https://example.com/seti", "Other"]
];

async function seedData() {
  console.log(`Seeding ${marketsData.length} markets as ${CREATOR}...`);

  for (let i = 0; i < marketsData.length; i++) {
    const market = marketsData[i];
    const [title, desc, url, category] = market;

    try {
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "create_market",
        args: [
          title,           // string
          desc,            // string
          url,             // string
          category,        // string
          CREATOR,         // string
          0,               // Number (GenLayer will parse it based on ABI if provided, or infers if it's explicitly typed by genlayer-js)
          0                // Number
        ],
      });
      console.log(`✅ Success (TX submitted): ${title} : ${tx}`);
      
      // Wait for it to be accepted
      await new Promise(r => setTimeout(r, 6000));
    } catch (e) {
      console.error(`❌ Error on ${title}:`, e.message);
    }
  }
}

seedData();
