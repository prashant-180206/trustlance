import { supabase } from '@/lib/supabaseClient';
import { uploadToIpfs } from '@/lib/ipfs';

export class MilestoneService {
  static async submitDeliverable(milestoneId: string, file: File, signer: unknown): Promise<{ cid: string; txHash: string }> {
    const { cid } = await uploadToIpfs(file, { relatedType: 'milestone_deliverable', relatedId: milestoneId }); // FR-IP-1
    // call escrow.submitMilestone(index, cid) on-chain (FR-FM-5, FR-SC-2)
    // index-chain-events will update milestones.status='submitted' + deliverable_cid
    return { cid, txHash: '0x...' };
  }

  static async approve(milestoneId: string, signer: unknown): Promise<string> {
    // calls escrow.approveMilestone(index) — triggers on-chain payment release (FR-CM-7, FR-SC-3)
    ...
  }

  static async reject(milestoneId: string, signer: unknown): Promise<string> {
    // calls escrow.rejectMilestone(index) (FR-CM-8)
    ...
  }
}
