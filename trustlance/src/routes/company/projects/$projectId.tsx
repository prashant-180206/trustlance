import { createFileRoute } from "@tanstack/react-router";
import {
    useProject,
    useProjectEscrow,
    useProjectBlockchainStatus,
} from "../../../hooks/project.hooks";

export const Route = createFileRoute(
    "/company/projects/$projectId",
)({
    component: CompanyProject,
});

function CompanyProject() {
    const { projectId } = Route.useParams();

    const projectQuery = useProject(projectId);
    const escrowQuery = useProjectEscrow(projectId);
    const blockchainQuery =
        useProjectBlockchainStatus(projectId);

    if (projectQuery.isLoading) {
        return <div>Loading...</div>;
    }

    if (projectQuery.error) {
        return <div>{projectQuery.error.message}</div>;
    }

    const project = projectQuery.data;

    if (!project) {
        return <div>Project not found.</div>;
    }

    return (
        <div>
            <h1>{project.title}</h1>

            <p>{project.description}</p>

            <p>Budget: {project.budget}</p>

            <p>Status: {project.status}</p>

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
                        null,
                        2,
                    )}
                </pre>
            )}

            {/* Award / Fund / Cancel actions go here */}
        </div>
    );
}