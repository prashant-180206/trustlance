import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { Address } from "viem";
import { useFundProject } from "../../../../../hooks/project.hooks";
import { Button, ErrorMessage, Field, Shell, Textarea } from "../../../../-components";

export const Route = createFileRoute("/company/projects/$projectId/milestones/new")({
  component: NewMilestones,
});

type MilestoneDraft = {
  amount: string;
  description: string;
};

function NewMilestones() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const fundProject = useFundProject();
  const [freelancerWallet, setFreelancerWallet] = useState("");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { amount: "", description: "" },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const updateMilestone = (
    index: number,
    field: keyof MilestoneDraft,
    value: string,
  ) => {
    setMilestones((current) => current.map((milestone, milestoneIndex) => (
      milestoneIndex === index ? { ...milestone, [field]: value } : milestone
    )));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!freelancerWallet.startsWith("0x")) {
      setFormError("Enter the awarded freelancer wallet address.");
      return;
    }

    if (milestones.some(({ amount, description }) => !amount || !description.trim())) {
      setFormError("Every milestone needs an amount and description.");
      return;
    }

    try {
      fundProject.mutate({
        projectId,
        freelancerWallet: freelancerWallet as Address,
        milestoneData: {
          amounts: milestones.map(({ amount }) => BigInt(amount)),
          descriptions: milestones.map(({ description }) => description.trim()),
        },
      }, {
        onSuccess: () => navigate({ to: "/company/projects/$projectId/milestones", params: { projectId } }),
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Invalid milestone amount.");
    }
  };

  return (
    <Shell title="Add milestones" role="company">
      <form className="grid max-w-2xl gap-5" onSubmit={submit}>
        <Field label="Freelancer wallet" value={freelancerWallet} onChange={(event) => setFreelancerWallet(event.target.value)} placeholder="0x..." required />
        {milestones.map((milestone, index) => (
          <fieldset key={index} className="grid gap-3 rounded border bg-white p-4">
            <legend className="font-semibold">Milestone {index + 1}</legend>
            <Field label="Amount in wei" type="number" min="1" value={milestone.amount} onChange={(event) => updateMilestone(index, "amount", event.target.value)} required />
            <Textarea label="Description" value={milestone.description} onChange={(event) => updateMilestone(index, "description", event.target.value)} required />
            {milestones.length > 1 && <Button type="button" onClick={() => setMilestones((current) => current.filter((_, milestoneIndex) => milestoneIndex !== index))}>Remove milestone</Button>}
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => setMilestones((current) => [...current, { amount: "", description: "" }])}>Add another milestone</Button>
          <Button type="submit" disabled={fundProject.isPending}>{fundProject.isPending ? "Funding..." : "Fund and award project"}</Button>
          <Link to="/company/projects/$projectId/milestones" params={{ projectId }} className="rounded border px-3 py-2 text-sm">Cancel</Link>
        </div>
        <ErrorMessage error={formError ? new Error(formError) : fundProject.error} />
      </form>
    </Shell>
  );
}