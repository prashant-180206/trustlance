import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useState } from "react";
import { profileService } from "../../lib/services/profile.service";
import { projectService } from "../../lib/services/project.service";

export const Route = createFileRoute("/projects/new")({
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: 0,
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = await profileService.getProfile();
      // We need the company_profile_id, not just the profile.id
      // In this schema, company_profiles.profile_id = profiles.id
      await projectService.createProject(profile.id, formData);
      alert("Project created successfully!");
      navigate({ to: "/projects" });
    } catch (error) {
      console.error(error);
      alert("Error creating project. Make sure you have a company profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Post a New Project</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded border shadow-sm">
        <div>
          <label className="block font-medium mb-1">Project Title</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="e.g. Smart Contract Audit"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            className="w-full border p-2 rounded h-32"
            placeholder="Describe project scope and milestones..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Budget (ETH)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border p-2 rounded"
              placeholder="0.5"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Deadline</label>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:bg-blue-300"
        >
          {loading ? "Creating..." : "Create Project & Setup Escrow"}
        </button>
      </form>
    </div>
  );
}
