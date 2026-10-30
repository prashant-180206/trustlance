from __future__ import annotations

from trustlance_bot.ui.keyboards import classify_input, extract_address, extract_project_id

PROJECT_ID = "3f0c2a9e-8b1d-4c7a-9e2f-1a2b3c4d5e6f"
WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"


def test_classifies_project_id() -> None:
    assert classify_input(PROJECT_ID) == ("project", PROJECT_ID)


def test_classifies_pasted_project_link() -> None:
    text = f"http://localhost:5173/project/{PROJECT_ID}/"
    assert classify_input(text) == ("project", PROJECT_ID)


def test_classifies_wallet_address() -> None:
    assert classify_input(WALLET) == ("company", WALLET)


def test_classifies_invalid_text() -> None:
    assert classify_input("hello there") == ("invalid", None)


def test_extractors_return_none_when_missing() -> None:
    assert extract_project_id("no id here") is None
    assert extract_address("no wallet here") is None
