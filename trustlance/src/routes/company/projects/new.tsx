import { createFileRoute } from "@tanstack/react-router";
import { useCreateProject } from "../../../hooks/project.hooks";

export const Route = createFileRoute("/company/projects/new")({
  component: NewProject,
});

function NewProject() {
  const createProject = useCreateProject();

  return (
    <div>
      <h1>Create Project</h1>

      <button
        disabled={createProject.isPending}
        onClick={() => {
          // Form submission will go here
        }}
      >
        {createProject.isPending
          ? "Creating..."
          : "Create Project"}
      </button>
    </div>
  );
}