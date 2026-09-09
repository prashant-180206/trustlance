// lib/contracts/getEscrowContract.ts
import { getContract, type WalletClient, type PublicClient } from 'viem';
import { escrowAbi } from './escrowAbi';

export function getEscrowContract(address: `0x${string}`, client: WalletClient | PublicClient) {
  return getContract({ address, abi: escrowAbi, client });
}
