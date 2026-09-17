import { formatEther, formatGwei } from "viem";

export function cx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function shortenAddress(
  address: string | undefined,
  chars = 6,
): string {
  if (!address) return "—";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatEth(wei: bigint | undefined): string {
  if (wei === undefined) return "—";
  return `${formatEther(wei)} ETH`;
}

export function formatGweiString(wei: bigint | undefined): string {
  if (wei === undefined) return "—";
  return formatGwei(wei);
}

export function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined);
}

export function isValidProjectId(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

export function encodeProjectId(seed: string): `0x${string}` {
  const bytes = new TextEncoder().encode(seed);
  let hex = "0x";
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, "0");
  }
  return (hex + "0".repeat(64 - hex.length + 2).padStart(0)) as `0x${string}`;
}

export function randomProjectId(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  ) as `0x${string}`;
}