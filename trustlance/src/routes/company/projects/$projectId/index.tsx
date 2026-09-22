import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { Address } from "viem";
import {
    useProject,
    useProjectEscrow,
    useProjectBlockchainStatus,
    useFundProject,
    useRequestCancellation,
    useCancelProjectBeforeAward,
} from "../../../../hooks/project.hooks";
import { useProjectApplications } from "../../../../hooks/application.hooks";
import { Link } from "@tanstack/react-router";
import { Button, ErrorMessage, Field, Shell, Textarea } from "../../../-components";

export const Route = createFileRoute(
    "/company/projects/$projectId/",
)({
    component: CompanyProject,
});

function CompanyProject() {
    const { projectId } = Route.useParams();

    const projectQuery = useProject(projectId);
    const escrowQuery = useProjectEscrow(projectId);
    const blockchainQuery =
        useProjectBlockchainStatus(projectId);
    const applicationsQuery = useProjectApplications(projectId);
    const fund = useFundProject();
    const requestCancellation = useRequestCancellation();
    const cancelBeforeAward = useCancelProjectBeforeAward();
    const [freelancerWallet, setFreelancerWallet] = useState("");
    const [amounts, setAmounts] = useState("");
    const [descriptions, setDescriptions] = useState("");

    if (projectQuery.isLoading) {
        return <Shell title="Project" role="company"><p>Loading...</p></Shell>;
    }

    if (projectQuery.error) {
        return <Shell title="Project" role="company"><ErrorMessage error={projectQuery.error} /></Shell>;
    }

    const project = projectQuery.data;

    if (!project) {
        return <Shell title="Project" role="company"><p>Project not found.</p></Shell>;
    }

    return (
        <Shell title={project.title} role="company">

            <p>{project.description}</p>

            <p>Budget: {project.budget}</p>

            <p>Status: {project.status}</p>

            <div className="my-4 flex gap-3">
                <Link to="/company/projects/$projectId/milestones" params={{ projectId }} className="text-sm underline">Milestones</Link>
                <Link to="/company/projects/$projectId/disputes" params={{ projectId }} className="text-sm underline">Disputes</Link>
            </div>

            <hr />

            <h2>Escrow</h2>

            {escrowQuery.isLoading ? (
                <p>Loading escrow...</p>
            ) : (
                <p>{escrowQuery.data}</p>
            )}

            <h2>Blockchain Status</h2>

            {blockchainQuery.isLoading ? (
                <p>Loading blockchain status...</p>
            ) : (
                <pre>
                    {JSON.stringify(
                        blockchainQuery.data,
                        (_, value) =>
                            typeof value === "bigint"
                                ? value.toString()
                                : value,
                        2,
                    )}
                </pre>
            )}

            <h2 className="mt-6 text-lg font-semibold">Applications</h2>
            <div className="grid gap-2">{applicationsQuery.data?.map((application) => <a key={application.id} href={`/company/applications/${application.id}`} className="rounded border bg-white p-3">{application.freelancer_id} - {application.status} - {application.proposed_amount ?? "-"}</a>)}</div>

            <div className="mt-6 grid max-w-xl gap-4">
                <h2 className="text-lg font-semibold">Fund and award</h2>
                <Field label="Freelancer wallet" value={freelancerWallet} onChange={(event) => setFreelancerWallet(event.target.value)} placeholder="0x..." />
                <Textarea label="Amounts in wei, one per line" value={amounts} onChange={(event) => setAmounts(event.target.value)} />
                <Textarea label="Descriptions, one per line" value={descriptions} onChange={(event) => setDescriptions(event.target.value)} />
                <Button disabled={!project.escrow_address || fund.isPending} onClick={() => fund.mutate({ projectId, freelancerWallet: freelancerWallet as Address, milestoneData: { amounts: amounts.split(/\r?\n/).filter(Boolean).map((amount) => BigInt(amount)), descriptions: descriptions.split(/\r?\n/).filter(Boolean) } })}>{fund.isPending ? "Funding..." : "Fund and award"}</Button>
                <div className="flex gap-2"><Button disabled={requestCancellation.isPending} onClick={() => requestCancellation.mutate({ projectId })}>Request cancellation</Button><Button disabled={cancelBeforeAward.isPending} onClick={() => cancelBeforeAward.mutate({ projectId })}>Cancel before award</Button></div>
                <ErrorMessage error={fund.error ?? requestCancellation.error ?? cancelBeforeAward.error} />
            </div>
        </Shell>
    );
}