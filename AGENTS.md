# AGENTS.md

TrustLance is a decentralized freelancing platform (escrow contracts + Supabase + Next.js). This repo is four independent packages — no root `package.json`, no shared workspace. Run installs and commands inside each package dir, not from the root.

- `trustlance/` — Next.js 16 app. See `trustlance/AGENTS.md`.
- `blockchain/` — Hardhat 3 + Solidity. See `blockchain/AGENTS.md` and the `hardhat` skill under `blockchain/.agents/skills/`.
- `supabase/` — Postgres migrations + `config.toml`. No Edge Functions exist yet.
- `telegram-bot/` — Python 3.13 + uv Telegram client for browsing/searching projects. See `telegram-bot/README.md` and the `telegram-bot` skill under `.agents/skills/`.

## trustlance (Next.js 16)
- Next 16.3.4 / React 19 / pnpm 12.3.4. Next 16 has breaking changes: `next dev` maintains the `BEGIN:nextjs-agent-rules` block in `trustlance/AGENTS.md` — read `node_modules/next/dist/docs/` before writing Next code and keep that block intact.
- Scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint` (eslint). No typecheck script.
- Env lives in `trustlance/.env.local` (gitignored). `src/` reads only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_RPC_URL`. README's `NEXT_PUBLIC_FACTORY_ADDRESS`/`NEXT_PUBLIC_CHAIN_ID` are not consumed anywhere.
- `src/lib/services/*` are unimplemented stubs (TODO bodies, `...` placeholders) importing non-existent `@/lib/supabaseClient`; the real modules are `src/lib/supabase/client.ts` / `server.ts`. The services aren't imported by app code yet. `src/lib/ipfs.ts` and `src/lib/siwe.ts` are empty.
- Wagmi/Viem are wired in root `layout.tsx` via `Web3Provider` to chain `hardhatLocal` (id 31337) using the injected (MetaMask) connector.

## blockchain (Hardhat 3)
- Uses `hardhat-toolbox-viem`. All tests are TypeScript with **`node:test` + `node:assert` + viem** via `network.getOrCreate()` — NOT mocha/chai/ethers (ignore the sample README). Load the `hardhat` skill before writing tests or config.
- `package.json` `test` script is a placeholder; run `pnpm hardhat test`. No `.t.sol` unit tests exist; only `test/*.ts`.
- Deployment is `scripts/deploy.ts` (deploys `TrustLanceFactory`, wallet[1] = dispute resolver), not Ignition. `hardhat.config.ts` only defines `hardhatMainnet` (edr-simulated) — the README's `--network localhost` flag has no matching config entry.

## supabase
- Only `migrations/` so far (initial schema: projects/milestones/proposals/disputes/dao_votes/files/notifications/transactions/auth_nonces, plus `handle_new_user` and `after_vote_cast` triggers). No `functions/`, RLS policies, seeds, or `index-chain-events` yet.
- Regenerate committed `trustlance/src/types/database.types.ts` via `supabase gen types typescript --linked` — never hand-edit.
- Local dev: `supabase start` / `supabase stop`; push schema with `supabase db push`. Local DB is Postgres 17.

## telegram-bot (Python 3.13 + uv)
- Managed with **uv only** — never `pip` or a hand-made venv. From `telegram-bot/`: `uv sync`, `uv add <pkg>`, `uv run ...`. Commit `uv.lock`.
- Read-only by design: no private keys, no transaction signing, no custody. State-changing actions link out to the web app.
- Data comes from Supabase `projects` (service-role key, server-side only) and the factory/escrow contracts via `web3.py` `AsyncWeb3`. Chain is Anvil 31337.
- ABIs are generated from `blockchain/artifacts/`; never hand-edit the JSON.
- Checks: `uv run pytest`, `uv run ruff check .`, `uv run mypy src`.
- Load the `telegram-bot` skill under `.agents/skills/` before adding handlers, queries, or contract reads.