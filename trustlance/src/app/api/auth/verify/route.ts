import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";

import { getSigningChainId, walletToEmail } from "@/lib/siwe";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const message = body?.message;
  const signature = body?.signature;

  if (typeof message !== "string" || typeof signature !== "string") {
    return NextResponse.json(
      { error: "message and signature are required." },
      { status: 400 },
    );
  }

  let siwe: SiweMessage;
  try {
    siwe = new SiweMessage(message);
  } catch {
    return NextResponse.json(
      { error: "Invalid SIWE message." },
      { status: 400 },
    );
  }

  const expectedChainId = getSigningChainId();
  if (siwe.chainId !== expectedChainId) {
    return NextResponse.json(
      { error: `Signed for the wrong chain (expected chain ${expectedChainId}).` },
      { status: 400 },
    );
  }

  const requestHost = request.headers.get("host");
  if (requestHost && siwe.domain !== requestHost) {
    return NextResponse.json(
      { error: "SIWE domain does not match the request origin." },
      { status: 400 },
    );
  }

  const wallet = siwe.address.toLowerCase();
  const admin = getAdminClient();

  const { data: nonceRow, error: nonceError } = await admin
    .from("auth_nonces")
    .select("nonce, expires_at")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (nonceError || !nonceRow) {
    return NextResponse.json(
      { error: "No pending SIWE request for this wallet." },
      { status: 401 },
    );
  }

  if (new Date(nonceRow.expires_at).getTime() < Date.now()) {
    await admin.from("auth_nonces").delete().eq("wallet_address", wallet);
    return NextResponse.json(
      { error: "SIWE nonce expired. Please try again." },
      { status: 401 },
    );
  }

  const result = await siwe.verify(
    {
      signature,
      nonce: nonceRow.nonce,
      time: new Date().toISOString(),
    },
    { suppressExceptions: true },
  );

  if (!result.success || result.error) {
    await admin.from("auth_nonces").delete().eq("wallet_address", wallet);
    return NextResponse.json(
      { error: result.error?.message ?? "Invalid signature." },
      { status: 401 },
    );
  }

  // The nonce is single-use.
  await admin.from("auth_nonces").delete().eq("wallet_address", wallet);

  const email = walletToEmail(wallet);

  // Creates the auth user on first login (user_metadata.wallet_address makes the
  // handle_new_user trigger create the matching profile row) and returns a token
  // that the client exchanges for a session via supabase.auth.verifyOtp().
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: request.headers.get("origin") ?? undefined,
      data: { wallet_address: wallet },
    },
  });

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to issue a session." },
      { status: 500 },
    );
  }

  return NextResponse.json({ tokenHash: data.properties.hashed_token });
}