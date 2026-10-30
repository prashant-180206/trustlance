# TrustLance Telegram bot

A read-only Telegram bot for people who are not comfortable with wallets or block
explorers. It lets them browse and search TrustLance projects, read project details,
and check escrow/milestone status in plain language. Anything that needs a signature
(funding, approving, disputing) links out to the web app.

## Status

Project scaffold only — dependencies, ABIs, and tooling are in place; handlers are not
implemented yet.

## Requirements

- Python 3.13 (uv installs it automatically)
- [uv](https://docs.astral.sh/uv/) (already installed to `~/.local/bin` in this repo's setup)
- Anvil running on `http://127.0.0.1:8545` for on-chain reads
- Supabase URL + service-role key for project data

## Setup

```bash
cd telegram-bot
cp .env.example .env      # fill in the secrets
uv sync
uv run trustlance-bot
```

`uv` is the only package manager used here. Do not use `pip` or a manual `venv`.

## Commands

```bash
uv sync                       # install locked dependencies
uv add <package>              # add a runtime dependency
uv add --dev <package>        # add a dev dependency
uv run trustlance-bot         # start the bot
uv run pytest                 # tests
uv run ruff check .           # lint
uv run ruff format .          # format
uv run mypy src               # type-check
uv run python scripts/sync_abis.py   # regenerate ABIs from blockchain/artifacts
```

## Environment

See `.env.example`. The bot-specific names are `TELEGRAM_BOT_TOKEN`, `RPC_URL`,
`CHAIN_ID`, `FACTORY_ADDRESS`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (optional, server-side), `WEB_APP_URL`, `LOG_LEVEL`,
`CACHE_TTL_SECONDS`, `REQUEST_TIMEOUT_SECONDS`.

Never commit `.env`. The Supabase service-role key is server-side only.

## Data sources

- Supabase `projects` (title, description, budget, deadline, status, escrow address)
  joined with `company_profiles(company_name)`.
- `TrustLanceFactory` and `TrustLanceEscrow` over JSON-RPC via `web3.py` `AsyncWeb3`.
  ABIs live in `src/trustlance_bot/abis/` and are generated from `blockchain/artifacts/`.

See the `telegram-bot` skill in `.agents/skills/telegram-bot/SKILL.md` for contract
functions, milestone statuses, safety rules, and UX conventions.

## Safety

Read-only: no private keys, no signing, no custody. Secret values are never sent to
Telegram or written to logs.
