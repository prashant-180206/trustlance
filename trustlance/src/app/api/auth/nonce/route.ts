import { NextRequest, NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { isAddress } from "viem";

import { NONCE_TTL_MS } from "@/lib/siwe";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const address = body?.address;

  if (typeof address !== "string" || !isAddress(address)) {
    return NextResponse.json(
      { error: "A valid Ethereum address is required." },
      { status: 400 },
    );
  }

  const wallet = address.toLowerCase();
  const nonce = generateNonce();
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS).toISOString();

  const admin = getAdminClient();

  const { error } = await admin
    .from("auth_nonces")
    .upsert(
      { wallet_address: wallet, nonce, expires_at: expiresAt },
      { onConflict: "wallet_address" },
    );

  if (error) {
    return NextResponse.json(
      { error: `Failed to issue a nonce: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ nonce });
}