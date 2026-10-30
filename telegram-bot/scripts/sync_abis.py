"""Copy the compiled contract ABIs from blockchain/artifacts into the bot package.

Run from telegram-bot/:  uv run python scripts/sync_abis.py

The artifacts are the source of truth. Never hand-edit the JSON files in
src/trustlance_bot/abis/.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT.parent / "blockchain" / "artifacts" / "contracts"
OUT_DIR = ROOT / "src" / "trustlance_bot" / "abis"

CONTRACTS = {
    "factory": ARTIFACTS / "TrustLanceFactory.sol" / "TrustLanceFactory.json",
    "escrow": ARTIFACTS / "TrustLanceEscrow.sol" / "TrustLanceEscrow.json",
}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for name, path in CONTRACTS.items():
        if not path.exists():
            raise SystemExit(f"missing artifact: {path}")

        artifact = json.loads(path.read_text(encoding="utf-8"))
        abi = artifact.get("abi")
        if not isinstance(abi, list) or not abi:
            raise SystemExit(f"no ABI in {path}")

        destination = OUT_DIR / f"{name}.json"
        destination.write_text(
            json.dumps(abi, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"wrote {destination.relative_to(ROOT)} ({len(abi)} entries)")


if __name__ == "__main__":
    main()
