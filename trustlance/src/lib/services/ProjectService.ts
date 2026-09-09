import { supabase } from '@/lib/supabaseClient';
import type { Project, Milestone } from '@/types/domain';

export class ProjectService {
    static async list(filters: { category?: string; skills?: string[] }): Promise<Project[]> {
        let query = supabase.from('projects').select('*').eq('status', 'open');
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.skills?.length) query = query.contains('skills', filters.skills);
        const { data, error } = await query;
        if (error) throw error;
        return data as Project[];
    }

    static async getById(projectId: string): Promise<Project> {
        const { data, error } = await supabase
            .from('projects')
            .select('*, milestones(*)')
            .eq('id', projectId)
            .single();
        if (error) throw error;
        return data as Project;
    }

    static async create(input: Omit<Project, 'id' | 'status' | 'contractAddress' | 'awardedFreelancerId'>,
        milestones: Omit<Milestone, 'id' | 'projectId' | 'status' | 'deliverableCid'>[]): Promise<Project> {
    // 1) insert project row (status: 'draft')
    // 2) bulk-insert milestone rows
    // returns the created project; escrow deployment happens separately in fund()
    // ...
    }

    static async fund(projectId: string, signer: /* viem WalletClient */ unknown): Promise<string> {
    // 1) deploy TrustLanceEscrow via factory contract (client-signed tx)
    // 2) update projects.contract_address + status='open' optimistically
    // 3) actual authoritative status flip happens via index-chain-events on ProjectFunded event
    // ...
    }

    static async awardFreelancer(projectId: string, freelancerId: string, signer: unknown): Promise<string> {
    // calls escrow.awardFreelancer(address) on-chain, then updates awarded_freelancer_id
    // ...
    }
}
