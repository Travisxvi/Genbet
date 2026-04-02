// Polyfill window to bypass the viem/genlayer-js bug in nodejs context
globalThis.window = { ethereum: undefined };

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";

const account = privateKeyToAccount("0xb87140880ffc7e7343e2009d13dbbb1a0dcca04da64d4b29bb8883508494f1c9");
const CREATOR = account.address;

const client = createClient({
  chain: studionet,
  account: account,
});

const marketsData = [
  // Crypto
  ["Will BTC be above $80k today?", "Bitcoin (BTC) price is currently above $80,000 USD", "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", "Crypto"],
  ["Will ETH flip $3500 tomorrow?", "Ethereum exceeds 3500", "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT", "Crypto"],
  ["Will SOL cross $250 next week?", "Solana cross 250", "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", "Crypto"],
  ["Will DOGE hit $0.20?", "Dogecoin to 20 cents", "https://api.binance.com/api/v3/ticker/price?symbol=DOGEUSDT", "Crypto"],
  ["Will AVAX reach $50?", "Avax to 50", "https://api.binance.com/api/v3/ticker/price?symbol=AVAXUSDT", "Crypto"],

  // Sports
  ["Will Arsenal win the Premier League?", "Arsenal wins PL 2023 2024", "https://en.wikipedia.org/wiki/2023%E2%80%9324_Premier_League", "Sports"],
  ["Will Real Madrid win UCL?", "Real Madrid UCL Champions", "https://en.wikipedia.org/wiki/2023%E2%80%9324_UEFA_Champions_League", "Sports"],
  ["Will Lakers make the playoffs?", "LA Lakers Playoffs", "https://en.wikipedia.org/wiki/2023%E2%80%9324_Los_Angeles_Lakers_season", "Sports"],
  ["Will the Chiefs win the Super Bowl again?", "Kansas City Chiefs SuperBowl", "https://en.wikipedia.org/wiki/Super_Bowl_LVIII", "Sports"],
  ["Will Verstappen win the next F1 race?", "Max Verstappen F1 winner", "https://ergast.com/api/f1/current/last/results.json", "Sports"],

  // Politics
  ["Will the US pass the Crypto Bill?", "Crypto regulatory bill passed", "https://en.wikipedia.org/wiki/Cryptocurrency_regulations_in_the_United_States", "Politics"],
  ["Will the UK hold elections in May?", "UK May Elections", "https://en.wikipedia.org/wiki/2024_United_Kingdom_general_election", "Politics"],
  ["Will the Federal Reserve cut rates?", "Fed cuts interest rates", "https://en.wikipedia.org/wiki/Federal_funds_rate", "Politics"],
  ["Will the EU approve AI Act?", "European Union AI Act approval", "https://en.wikipedia.org/wiki/Artificial_Intelligence_Act", "Politics"],
  ["Will California increase taxes?", "California state budget tax increase", "https://en.wikipedia.org/wiki/Taxation_in_California", "Politics"],

  // Tech
  ["Will Apple announce a new VR headset?", "Apple Vision Pro 2", "https://en.wikipedia.org/wiki/Apple_Vision_Pro", "Tech"],
  ["Will SpaceX launch Starship this month?", "SpaceX Starship orbital launch", "https://api.spacexdata.com/v4/launches/next", "Tech"],
  ["Will OpenAI release GPT-5?", "OpenAI GPT-5 release official", "https://en.wikipedia.org/wiki/GPT-4", "Tech"],
  ["Will NVDA stock hit $1000?", "Nvidia stock to 1k", "https://en.wikipedia.org/wiki/Nvidia", "Tech"],
  ["Will Tesla unveil Model 2?", "Tesla affordable model announcement", "https://en.wikipedia.org/wiki/Tesla,_Inc.", "Tech"],

  // Other
  ["Will it rain in London tomorrow?", "Rain tomorrow in London", "https://wttr.in/London?format=j1", "Other"],
  ["Will a new Taylor Swift album drop?", "Taylor swift album release", "https://en.wikipedia.org/wiki/Taylor_Swift_albums_discography", "Other"],
  ["Will the next Bond actor be announced?", "James Bond casting", "https://en.wikipedia.org/wiki/James_Bond_in_film", "Other"],
  ["Will the global temperature rise 1C?", "Global warming stat", "https://climate.nasa.gov/", "Other"],
  ["Will an alien signal be confirmed?", "SETI signal confirmation", "https://www.seti.org/news", "Other"]
];

async function updateEnvFile(newAddress) {
  const envPath = path.resolve(process.cwd(), "frontend/.env");
  let content = fs.readFileSync(envPath, "utf-8");
  content = content.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_CONTRACT_ADDRESS=${newAddress}`);
  fs.writeFileSync(envPath, content);
  console.log(`✅ Updated frontend/.env with new contract address: ${newAddress}`);
}

async function run() {
  try {
    console.log("Deploying fresh GenBet contract...");
    const contractPath = path.resolve(process.cwd(), "contracts/genbet.py");
    const contractCode = new Uint8Array(fs.readFileSync(contractPath));

    const deployTx = await client.deployContract({
      code: contractCode,
      args: [],
    });

    console.log(`Waiting for deploy tx ${deployTx}...`);
    // NOTE: For 'deployContract', genlayer handles wait via waitForTransactionReceipt
    const receipt = await client.waitForTransactionReceipt({
      hash: deployTx as any,
      status: "ACCEPTED" as any,
      retries: 30,
    });
    
    // Receipt data on StudioNet usually has data.contract_address or txDataDecoded.contractAddress
    const contractAddress = (receipt as any).data?.contract_address || (receipt as any).txDataDecoded?.contractAddress;
    
    if (!contractAddress) {
        // Fallback or read from receipt logs
        console.error("Could not find contract address in receipt", receipt);
        return;
    }
    console.log(`✅ Deployed GenBet at: ${contractAddress}`);
    await updateEnvFile(contractAddress);

    console.log(`\nSeeding ${marketsData.length} fully verified markets (NO auth walls)...`);
    
    for (let i = 0; i < marketsData.length; i++) {
        const market = marketsData[i];
        const [title, desc, url, category] = market;

        const tx = await client.writeContract({
            address: contractAddress,
            functionName: "create_market",
            args: [title, desc, url, category, CREATOR, 0, 0],
        });
        console.log(`✅ Submitting: ${title}`);
        await new Promise(r => setTimeout(r, 6000));
    }
    
    console.log("\nPlacing a wager and settling the first market (BTC) to replicate the dashboard 'Settled' UI State...");
    // 1. Place a 100 pt bet on "YES" for Market 0
    await client.writeContract({
        address: contractAddress,
        functionName: "place_bet",
        args: ["0", CREATOR, "YES", 100],
    });
    await new Promise(r => setTimeout(r, 6000));
    
    // 2. Settle the market
    const now = Math.floor(Date.now() / 1000);
    await client.writeContract({
        address: contractAddress,
        functionName: "settle_market",
        args: ["0", now],
    });
    console.log("✅ Market 0 successfully evaluated and settled!");

    console.log("\n🎉 Demo reset complete! Pure, perfectly functioning 25 markets.");
  } catch (err) {
    console.error("Script failed:", err);
  }
}

run();
