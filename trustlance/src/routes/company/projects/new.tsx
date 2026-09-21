import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateProject } from "../../../hooks/project.hooks";
import { useAuth } from "../../../hooks/provider/AuthProvider";
import { Button, ErrorMessage, Field, Shell, Textarea } from "../../-components";

export const Route = createFileRoute("/company/projects/new")({
  component: NewProject,
});

function NewProject() {
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  return (
    <Shell title="Create project" role="company">
      <form className="grid max-w-xl gap-4" onSubmit={(event) => { event.preventDefault(); if (!user?.id) return; createProject.mutate({ companyId: user.id, projectData: { title, description, budget: Number(budget), deadline: deadline || undefined } }, { onSuccess: (project) => navigate({ to: "/company/projects/$projectId", params: { projectId: project.id } }) }); }}>
        <Field label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} required />
        <Field label="Budget" type="number" min="0" value={budget} onChange={(event) => setBudget(event.target.value)} required />
        <Field label="Deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        <ErrorMessage error={createProject.error} />
        <Button type="submit" disabled={createProject.isPending}>{createProject.isPending ? "Creating..." : "Create project"}</Button>
      </form>
    </Shell>
  );
}