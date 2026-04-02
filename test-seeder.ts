import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

async function main() {
  const account = privateKeyToAccount(generatePrivateKey());
  console.log("Generated account:", account.address);

  const client = createClient({
    chain: studionet,
    account: account.address as any,
  });

  console.log("Sending a test contract call...");
  
  try {
    const CONTRACT_ADDRESS = "0xaE67Ade0cCfB2cFea11BAb5f64dE00C609806ef3";
    const tx = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "create_market",
      args: [
        "Test Market",
        "Test Description",
        "https://example.com/api",
        "Other",
        account.address,
        0,
        0
      ],
    });
    console.log("Tx success:", tx);
  } catch (error) {
    console.error("Tx failed:", error);
  }
}

main();
