import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useProject } from "../../../../hooks/project.hooks";
import { useApplyToProject } from "../../../../hooks/application.hooks";
import { useAuth } from "../../../../hooks/provider/AuthProvider";
import { Button, ErrorMessage, Field, Shell, Textarea } from "../../../-components";

export const Route = createFileRoute(
  "/freelancer/projects/$projectId/",
)({
  component: FreelancerProject,
});

function FreelancerProject() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const apply = useApplyToProject();
  const [proposal, setProposal] = useState("");
  const [proposedAmount, setProposedAmount] = useState("");

  const {
    data: project,
    isLoading,
    error,
  } = useProject(projectId);

  if (isLoading) return <Shell title="Project" role="freelancer"><p>Loading...</p></Shell>;
  if (!project) return <Shell title="Project" role="freelancer"><ErrorMessage error={error} /><p>Project not found.</p></Shell>;

  return (
    <Shell title={project.title} role="freelancer">
      <ErrorMessage error={error} />

      <p>{project.description}</p>

      <p>Budget: {project.budget}</p>

      <div className="my-4 flex gap-3">
        <Link to="/freelancer/projects/$projectId/milestones" params={{ projectId }} className="text-sm underline">Milestones</Link>
        <Link to="/freelancer/projects/$projectId/disputes" params={{ projectId }} className="text-sm underline">Disputes</Link>
      </div>

      <form className="mt-6 grid max-w-xl gap-4" onSubmit={(event) => { event.preventDefault(); if (!user?.id) return; apply.mutate({ projectId, freelancerId: user.id, proposal, proposedAmount: Number(proposedAmount) }); }}>
        <Textarea label="Proposal" value={proposal} onChange={(event) => setProposal(event.target.value)} required />
        <Field label="Proposed amount" type="number" min="0" value={proposedAmount} onChange={(event) => setProposedAmount(event.target.value)} required />
        <ErrorMessage error={apply.error} />
        <Button type="submit" disabled={apply.isPending}>{apply.isPending ? "Applying..." : "Apply to project"}</Button>
      </form>
    </Shell>
  );
}