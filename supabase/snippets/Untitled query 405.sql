create table public.auth_nonces (
  wallet_address  text primary key,
  nonce           text not null,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);
