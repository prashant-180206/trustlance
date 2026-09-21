import { createFileRoute, useParams } from "@tanstack/react-router";

import { useEffect, useState } from "react";
import type { Tables } from "../../lib/supabase/types";
import { projectService } from "../../lib/services/project.service";
import { profileService } from "../../lib/services/profile.service";


type Project = Tables<"projects">;
type Application = Tables<"applications">;

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = useParams({ from: "/projects/$projectId" });
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userProfile, setUserProfile] = useState<Tables<"profiles"> | null>(null);
  const [proposal, setProposal] = useState("");
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [proj, apps, profile] = await Promise.all([
          projectService.getProjectById(projectId),
          projectService.getProjectApplications(projectId),
          profileService.getProfile(),
        ]);
        setProject(proj);
        setApplications(apps);
        setUserProfile(profile);
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSubmitting(true);
    try {
      await projectService.applyToProject(projectId, userProfile.id, proposal, amount);
      alert("Application submitted!");
      // Refresh applications list
      const apps = await projectService.getProjectApplications(projectId);
      setApplications(apps);
    } catch (e) {
      alert("Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (appId: string) => {
    try {
      await projectService.updateApplicationStatus(appId, "accepted");
      alert("Freelancer accepted!");
      const apps = await projectService.getProjectApplications(projectId);
      setApplications(apps);
    } catch (e) {
      alert("Failed to accept freelancer");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading project details...</div>;
  if (!project) return <div className="p-6 text-center">Project not found.</div>;

  const isCompany = userProfile?.account_type === "company";
  const isFreelancer = userProfile?.account_type === "freelancer";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
        <p className="text-gray-600 mb-4">{project.description}</p>
        <div className="flex gap-6 text-sm font-medium">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Budget: {project.budget} ETH</span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Deadline: {project.deadline || "N/A"}</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Status: {project.status}</span>
        </div>
      </div>

      {isFreelancer && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Submit Proposal</h2>
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Proposal</label>
              <textarea
                className="w-full border p-2 rounded"
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder="Explain why you are the best fit..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Proposed Amount (ETH)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border p-2 rounded"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
            >
              {submitting ? "Submitting..." : "Send Proposal"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-bold mb-4">Applications</h2>
        <div className="space-y-4">
          {applications.length === 0 ? (
            <p className="text-gray-500 text-center">No applications yet.</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="p-4 border rounded flex justify-between items-start">
                <div>
                  <p className="font-bold">{app.freelancer_id || "Freelancer"}</p>
                  <p className="text-sm text-gray-600 mt-1">{app.proposal}</p>
                  <p className="text-sm font-semibold mt-2 text-blue-600">{app.proposed_amount} ETH</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${app.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {app.status}
                  </span>
                </div>
                {isCompany && app.status === "pending" && (
                  <button
                    onClick={() => handleAccept(app.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Accept
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
