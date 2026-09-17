export const SIWE_STATEMENT = "Sign in to TrustLance with Ethereum.";

export const NONCE_TTL_MS = 10 * 60 * 1000;

const DEFAULT_CHAIN_ID = 31337;

export function getSigningChainId(): number {
  const parsed = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  return Number.isFinite(parsed) ? parsed : DEFAULT_CHAIN_ID;
}

/** Deterministic email used to back an Ethereum wallet address in Supabase Auth. */
export function walletToEmail(address: string): string {
  return `${address.toLowerCase()}@wallet.trustlance.local`;
}

export interface CreateSiweMessageParams {
  address: string;
  chainId: number;
  nonce: string;
  domain: string;
  uri: string;
  statement?: string;
}

export function createSiweMessage({
  address,
  chainId,
  nonce,
  domain,
  uri,
  statement = SIWE_STATEMENT,
}: CreateSiweMessageParams): string {
  // EIP-4361 message as a plain string, so this module stays import-safe
  // in the browser (no ethers bundle). The server re-parses it strictly.
  const cleanStatement = statement.replace(/\n/g, " ");
  const issuedAt = new Date().toISOString();

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    cleanStatement,
    "",
    `URI: ${uri}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    "",
  ].join("\n");
}

export interface NonceResponse {
  nonce: string;
}

export interface VerifyResponse {
  tokenHash: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export async function requestNonce(address: string): Promise<string> {
  const response = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) throw new Error(await readErrorMessage(response));

  const data = (await response.json()) as NonceResponse;
  return data.nonce;
}

export async function submitVerification(
  message: string,
  signature: string,
): Promise<VerifyResponse> {
  const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });

  if (!response.ok) throw new Error(await readErrorMessage(response));

  return (await response.json()) as VerifyResponse;
}