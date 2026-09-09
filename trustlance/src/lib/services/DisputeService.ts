// lib/services/DisputeService.ts
import { supabase } from '@/lib/supabaseClient';

export class DisputeService {
  static async raise(milestoneId: string, reason: string, evidenceFile: File | null, signer: unknown) {
    // 1) optional evidence upload via uploadToIpfs (FR-DAO-1)
    // 2) escrow.raiseDispute(index) on-chain
    // 3) insert `disputes` row with status='open'; a follow-up admin/cron step flips to 'voting'
    //    with voting_start/voting_end (FR-DAO-2)
    // ...
  }

  static async castVote(disputeId: string, vote: 'client' | 'freelancer'): Promise<void> {
    // pure off-chain: insert into dao_votes (RLS + unique constraint enforce FR-DAO-3)
    const { error } = await supabase.from('dao_votes').insert({ dispute_id: disputeId, vote });
    if (error) throw error;
    // resolution + on-chain call happens later via the resolve-dispute Edge Function (§6.4)
  }
}
