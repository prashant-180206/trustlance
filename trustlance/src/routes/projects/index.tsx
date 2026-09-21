import { createFileRoute, Link } from "@tanstack/react-router";
// import { projectService } from "../lib/services/ProjectService";
import { useEffect, useState } from "react";
import { projectService } from "../../lib/services/project.service";

export const Route = createFileRoute("/projects/")({
  component: ProjectsIndexPage,
});

function ProjectsIndexPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await projectService.getAllProjects();
        setProjects(data || []);
      } catch (e) {
        console.error("Failed to load projects", e);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading projects...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link to="/projects/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Post New Project
        </Link>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="border rounded p-6 bg-white shadow-sm text-center">
            <p className="text-gray-500">No projects available yet.</p>
          </div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="p-4 border rounded bg-white shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{p.title}</h3>
                <p className="text-gray-600">{p.company_profiles?.company_name || "Unknown Company"}</p>
                <p className="text-sm text-blue-600 font-medium">{p.budget} ETH</p>
              </div>
              <Link to="/projects/$projectId" params={{ projectId: p.id }} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">
                View Details
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
