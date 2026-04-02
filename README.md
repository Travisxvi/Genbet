<div align="center">
  <h1>GenBet: AI-Powered Prediction Markets</h1>
  <p><b>Built for the GenLayer Bradbury Hackathon</b></p>
</div>

GenBet is a revolutionary, decentralized prediction market protocol powered by GenLayer's Equivalence Principle. Unlike traditional prediction markets that rely on rigid, centralized oracles or subjective human dispute panels, GenBet utilizes Intelligent Contracts and decentralized LLM consensus to automatically fetch, read, and verify real-world URLs to determine market outcomes instantly and completely trustlessly.

## Features

- **Oracle-Free & AI-Native**: GenBet doesn't use Oracles. The intelligent contract securely dispatches GenVM validators to browse public Wikipedia articles or raw JSON APIs. The network's LLM cluster analyzes the text to determine the outcome deterministically.
- **100% Trustless Settlement**: There are no admin keys. Once a market's deadline expires, any user on the network can trigger `settle_market`. The protocol independently finds the truth.
- **Dynamic Odds & Bonding**: Advanced Smart Contract logic efficiently tracks proportional betting stakes, enabling autonomous, self-balancing payout pools minus a creator-defined protocol fee.
- **Premium Cyber-Noir UI**: A polished, ultra-responsive Next.js dashboard featuring deep glassmorphism, neon cyan active states, dynamic grid layouts, and advanced frontend category switching. 

## Architecture

* **Smart Contract (`genbet.py`)**: Written in GenLayer's native Python environment. It utilizes `gl.nondet.web.render()` to capture web evidence, and `gl.eq_principle.prompt_comparative()` to execute trustless multi-node LLM consensus to evaluate if the text proves a "YES" or "NO" outcome.
* **Frontend Client**: Built with Next.js App Router and Tailwind CSS.
* **Blockchain Interfacing**: Integrated using `viem` and `genlayer-js` to handle non-custodial wallet connections, rapid concurrent localized state parsing (e.g., retrieving specific wager positions), and on-chain RPC executions.

## Getting Started

If you want to run GenBet locally, follow these steps:

### 1. Requirements
- Node.js (18.x or exactly)
- Python 3
- [GenLayer CLI / Simulator](https://docs.genlayer.com/)

### 2. Contract Deployment
Start the GenLayer simulator and deploy the contract:
```bash
cd contracts
genlayer deploy genbet.py
```
Copy the resulting Contract Address.

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
```
Create a `.env` file referencing your deployed intelligent contract:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here
```

### 4. Running the Dashboard
```bash
npm run dev
```
Open `http://localhost:3000` to interact with your local instance! 

### 5. Seeding Markets (Optional)
If you want to boot up the platform with 25 pristine, real-world markets utilizing zero-auth APIs (Binance, SpaceX, Wikipedia), run our massive seeding script:
```bash
npx tsx reset-demo.ts
```

## Built With
* [GenLayer](https://genlayer.com/) (Intelligent Contracts)
* [Next.js](https://nextjs.org/) (Frontend)
* [genlayer-js](https://docs.genlayer.com/develop/sdk) (SDK Interop)
* [Lucide Icons](https://lucide.dev/) (Visuals)

*Developed during the GenLayer Bradbury Hackathon.*
