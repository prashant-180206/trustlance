
# TrustLance

TrustLance is a decentralized freelancing platform that combines **smart-contract escrow**, **Supabase**, **Next.js**, and **IPFS** to provide a trust-minimized workflow between clients and freelancers.

The platform is designed around milestone-based work:

1. A client creates a project.
2. The project is divided into milestones.
3. Funds are locked through a smart-contract escrow.
4. The freelancer submits work and evidence.
5. The client approves the milestone.
6. The escrow releases the corresponding funds.
7. Disputes can be handled through the platform's dispute/DAO mechanism.

The project is split into three major applications:

```text
TrustLance/
│
├── trustlance/       # Next.js frontend/application
├── blockchain/       # Solidity + Hardhat smart contracts
└── supabase/         # Supabase database, migrations and Edge Functions
````

The overall architecture uses:

- **Next.js** — frontend and server-side application logic
- **Supabase** — PostgreSQL database, authentication/session infrastructure and Edge Functions
- **Solidity** — smart contracts
- **Hardhat 3** — smart-contract development, testing and deployment
- **Viem / Wagmi** — blockchain interaction from Next.js
- **IPFS** — decentralized file storage
- **Pinata** — IPFS pinning
- **MetaMask** — wallet interaction

The planned implementation also includes blockchain-to-database synchronization and DAO-based dispute handling.

---

# Project Structure

```text
TrustLance/
│
├── trustlance/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   │       ├── blockchain/
│   │       ├── contracts/
│   │       ├── services/
│   │       ├── supabase/
│   │       ├── types/
│   │       ├── ipfs.ts
│   │       └── siwe.ts
│   │
│   ├── public/
│   ├── .env.local
│   ├── package.json
│   └── ...
│
├── blockchain/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   ├── ignition/
│   ├── artifacts/
│   ├── hardhat.config.ts
│   └── package.json
│
└── supabase/
    ├── migrations/
    ├── functions/
    ├── config.toml
    └── ...
```

---

# Architecture

```text
                         ┌──────────────────┐
                         │     Browser      │
                         │                  │
                         │   Next.js UI     │
                         │   MetaMask       │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
             ┌─────────────┐             ┌─────────────┐
             │   Wagmi /   │             │   Next.js   │
             │    Viem     │             │   Server    │
             └──────┬──────┘             └──────┬──────┘
                    │                           │
                    ▼                           ▼
             ┌─────────────┐             ┌─────────────┐
             │ Blockchain  │             │  Supabase   │
             │             │             │ PostgreSQL  │
             │ Factory     │             │     +       │
             │ Escrow      │             │ Edge Funcs  │
             └─────────────┘             └──────┬──────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │    IPFS     │
                                         │   Pinata    │
                                         └─────────────┘
```

The client is responsible primarily for UI interaction and wallet-signed transactions.

Server-side Next.js logic is used for operations that should not expose privileged credentials or implementation details to the browser.

Supabase is used as the application's database/backend infrastructure rather than introducing a separate Node.js/Express backend.

---

# Prerequisites

Install the following before starting:

- Node.js
- pnpm
- Git
- MetaMask browser extension
- Supabase CLI
- A Supabase project

Verify the installations:

```bash
node --version
pnpm --version
git --version
supabase --version
```

---

# 1. Clone the Repository

```bash
git clone <repository-url>
cd TrustLance
```

The repository should contain:

```text
TrustLance/
├── trustlance/
├── blockchain/
└── supabase/
```

---

# 2. Install Dependencies

## Next.js

```bash
cd trustlance
pnpm install
```

## Blockchain

Open another terminal:

```bash
cd blockchain
pnpm install
```

## Supabase

If Supabase CLI dependencies/configuration are required locally:

```bash
cd supabase
```

Supabase CLI installation can be verified with:

```bash
supabase --version
```

---

# 3. Supabase Setup

Create a Supabase project.

Obtain the project URL and anonymous/public key from the Supabase project settings.

Inside:

```text
trustlance/.env.local
```

configure:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not expose the Supabase service-role key through a `NEXT_PUBLIC_` environment variable.

---

# 4. Supabase Database

The Supabase directory contains the database configuration and migrations:

```text
supabase/
├── migrations/
├── functions/
└── config.toml
```

Apply migrations using the project's Supabase workflow.

For local Supabase development, use:

```bash
supabase start
```

To stop local Supabase:

```bash
supabase stop
```

If the project is linked to a remote Supabase project:

```bash
supabase link
```

Then migrations can be pushed with:

```bash
supabase db push
```

The database layer contains the persistent application state, including projects, milestones, disputes and blockchain-related data.

Row Level Security (RLS) should remain enabled for application tables.

---

# 5. Generate Supabase Types

After the database schema has been created, generate TypeScript database types.

For a linked Supabase project:

```bash
supabase gen types typescript --linked > ../trustlance/src/lib/types/database.types.ts
```

The generated file can then be imported throughout the Next.js application.

Example:

```ts
import type { Database } from "@/lib/types/database.types";
```

Do not manually edit generated database types.

Regenerate them whenever the database schema changes.

---

# 6. Blockchain Setup

Move into the blockchain project:

```bash
cd blockchain
```

Install dependencies:

```bash
pnpm install
```

Compile the contracts:

```bash
pnpm hardhat compile
```

Hardhat generates artifacts containing the compiled contract information, including ABIs.

Typical artifacts are located under:

```text
blockchain/artifacts/
```

---

# 7. Start the Local Hardhat Blockchain

For local development, start the Hardhat node:

```bash
pnpm hardhat node
```

The local RPC endpoint is:

```text
http://127.0.0.1:8545
```

The default local chain ID is:

```text
31337
```

Keep this terminal running.

---

# 8. Deploy TrustLance Contracts Locally

The current deployment uses a Hardhat script.

For example, if the deployment script is:

```text
blockchain/scripts/deploy.ts
```

run:

```bash
pnpm hardhat run scripts/deploy.ts --network localhost
```

The deployment script deploys:

```text
TrustLanceFactory
```

and uses another local Hardhat account as the dispute resolver.

The command prints the deployed factory address:

```text
TrustLanceFactory: 0x...
```

Copy this address.

---

# 9. MetaMask Local Network

Add the local Hardhat network to MetaMask.

```text
Network Name: Hardhat Local

RPC URL:
http://127.0.0.1:8545

Chain ID:
31337

Currency Symbol:
ETH
```

Hardhat provides development accounts when the node starts.

The node prints the accounts and private keys:

```text
Account #0: 0x...
Private Key: 0x...

Account #1: 0x...
Private Key: 0x...
```

Import a development account into MetaMask.

> Never use Hardhat development private keys on a real network.

---

# 10. Next.js Environment Variables

Inside:

```text
trustlance/.env.local
```

configure the local blockchain:

```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337

NEXT_PUBLIC_FACTORY_ADDRESS=0x...
```

The factory address should be the address printed by the local deployment script.

Do not add a global escrow address unless the architecture actually uses a single globally deployed escrow contract.

For TrustLance, escrow contracts can be created by the factory, meaning individual escrow addresses can be obtained from the factory/on-chain events and persisted in Supabase.

---

# 11. Next.js Web3 Configuration

The frontend uses:

```text
Wagmi
   +
Viem
```

for Ethereum-compatible blockchain interaction.

The relevant configuration is under:

```text
trustlance/src/lib/blockchain/
```

Example structure:

```text
src/lib/blockchain/
├── config.ts
└── wagmi.ts
```

The local chain configuration points to:

```text
http://127.0.0.1:8545
```

with chain ID:

```text
31337
```

The application currently uses an injected wallet connector, such as MetaMask.

---

# 12. Contract ABIs

After compiling the Solidity contracts, Hardhat produces ABI information in the artifacts.

The frontend currently keeps the required ABIs under:

```text
trustlance/src/lib/contracts/
```

For example:

```text
src/lib/contracts/
├── escrowAbi.ts
├── factoryAbi.ts
└── getEscrowContract.ts
```

The ABI files should correspond to the currently deployed Solidity contracts.

Whenever the contract interface changes:

1. Compile the blockchain project.
2. Obtain the new ABI.
3. Update the frontend ABI.
4. Redeploy the local contracts.
5. Update the frontend contract address.

---

# 13. Run the Next.js Application

From:

```bash
cd trustlance
```

run:

```bash
pnpm dev
```

The application will normally be available at:

```text
http://localhost:3000
```

The local development environment should now look like:

```text
Terminal 1
──────────
Hardhat node
127.0.0.1:8545


Terminal 2
──────────
Next.js
localhost:3000
```

MetaMask connects to the Hardhat node.

---

# 14. Development Workflow

For normal local development:

### Terminal 1 — Blockchain

```bash
cd blockchain
pnpm hardhat node
```

### Terminal 2 — Deploy contracts

```bash
cd blockchain
pnpm hardhat run scripts/deploy.ts --network localhost
```

Copy the resulting factory address into:

```text
trustlance/.env.local
```

### Terminal 3 — Next.js

```bash
cd trustlance
pnpm dev
```

### Database

Use the Supabase project or local Supabase instance according to the current development configuration.

---

# 15. Important Local Development Behavior

The Hardhat local blockchain is ephemeral.

If you stop and restart:

```bash
pnpm hardhat node
```

the local chain is reset.

This means:

- accounts can change
- balances reset
- contract deployments disappear
- contract addresses may change
- previously created projects/escrows on the local chain disappear

Therefore, after restarting the Hardhat node, redeploy the contracts:

```bash
pnpm hardhat run scripts/deploy.ts --network localhost
```

and update:

```env
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
```

Restart the Next.js development server if necessary so it picks up the new environment variable.

---

# 16. Application Architecture

The Next.js application follows a separation between UI, services, database and blockchain logic.

```text
src/
│
├── app/
│   └── Pages / layouts / routes
│
├── components/
│   └── React UI components
│
└── lib/
    ├── blockchain/
    │   └── Wagmi/Viem configuration
    │
    ├── contracts/
    │   └── Contract ABIs and helpers
    │
    ├── services/
    │   ├── ProjectService.ts
    │   ├── MilestoneService.ts
    │   └── DisputeService.ts
    │
    ├── supabase/
    │   ├── client.ts
    │   └── server.ts
    │
    ├── types/
    │   └── database.types.ts
    │
    ├── ipfs.ts
    └── siwe.ts
```

The intended dependency direction is:

```text
UI
 ↓
Services
 ↓
Supabase / Blockchain / IPFS
```

Database and privileged operations should not be unnecessarily placed directly inside client components.

---

# 17. Blockchain vs Database

TrustLance uses both blockchain and database storage, but they serve different purposes.

## Blockchain

The blockchain is responsible for trust-critical state such as:

- escrow funds
- escrow ownership
- milestone financial state
- milestone approval/release
- dispute resolution
- on-chain transactions

## Supabase

Supabase stores application/query-oriented data such as:

- user profiles
- projects
- milestone metadata
- transaction records
- dispute metadata
- evidence metadata
- IPFS CIDs
- application state required for efficient querying

The database should not be treated as the authority for financial state that is enforced by the smart contract.

---

# 18. IPFS

Files such as deliverables and dispute evidence are intended to use IPFS.

The planned flow is:

```text
User
 ↓
Next.js
 ↓
Supabase Edge Function
 ↓
Pinata
 ↓
IPFS
 ↓
CID
 ↓
Supabase database
```

The CID is stored in Supabase so the application can associate the decentralized file with the corresponding project, milestone or dispute.

Sensitive Pinata credentials must remain server-side.

---

# 19. SIWE Authentication

TrustLance uses wallet-based authentication through **Sign-In with Ethereum (SIWE)**.

The conceptual flow is:

```text
User
 ↓
Connect wallet
 ↓
Request SIWE message
 ↓
User signs message
 ↓
Server verifies signature
 ↓
Authenticated application session
 ↓
Supabase
```

The private wallet key never leaves the user's wallet.

---

# 20. Future Blockchain Synchronization

The planned production architecture includes synchronization between blockchain events and Supabase.

The intended flow is:

```text
Smart Contract Event
        ↓
Blockchain provider/webhook
        ↓
Supabase Edge Function
        ↓
Database update
```

The planned implementation includes an event-indexing function such as:

```text
index-chain-events
```

This allows the application database to reflect confirmed on-chain events while keeping the blockchain authoritative for escrow/financial state.

---

# 21. Planned TrustLance Modules

The application is being developed incrementally in the following order:

```text
1. Supabase
   ├── Schema
   ├── RLS
   ├── Triggers
   ├── Types
   └── Edge Functions

2. Smart Contracts
   ├── TrustLanceFactory
   ├── TrustLanceEscrow
   ├── Tests
   └── Deployment

3. Next.js
   ├── Supabase integration
   ├── Wagmi/Viem
   ├── Wallet connection
   ├── SIWE
   ├── Services
   ├── React Query
   └── UI

4. IPFS
   ├── Uploads
   ├── Evidence
   └── CID persistence

5. Blockchain synchronization
   ├── Event indexing
   └── Database synchronization

6. DAO disputes
   ├── Dispute creation
   ├── Evidence
   ├── Voting
   └── Resolution

7. Final integration
   ├── Notifications
   ├── Admin dashboard
   ├── Transaction states
   └── Deployment
```

---

# 22. Quick Start

For local development, the shortest workflow is:

### Start blockchain

```bash
cd blockchain
pnpm install
pnpm hardhat compile
pnpm hardhat node
```

### Deploy contracts

In another terminal:

```bash
cd blockchain
pnpm hardhat run scripts/deploy.ts --network localhost
```

Copy the factory address into:

```text
trustlance/.env.local
```

### Start Next.js

```bash
cd trustlance
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000
```

Connect MetaMask to:

```text
Hardhat Local
RPC: http://127.0.0.1:8545
Chain ID: 31337
```

---

# Development Status

Current foundation:

```text
Next.js                     ✅
Next.js src/ architecture   ✅
Supabase configuration      ✅
Supabase clients            ✅
Database setup              ✅
Hardhat 3                   ✅
Local Hardhat node          ✅
Smart contracts             ✅
Local contract deployment   ✅
Contract ABIs               ✅
Wagmi                       ✅
Viem                        ✅
MetaMask localhost          ✅
Factory address config      ✅
```

The next development stage is integrating the actual **TrustLanceFactory and TrustLanceEscrow contract APIs into the Next.js service layer**.

```text
Next.js
   ↓
Wagmi / Viem
   ↓
TrustLanceFactory
   ↓
TrustLanceEscrow
   ↓
Supabase synchronization
```

---

# License

Add the project's license information here.

```
