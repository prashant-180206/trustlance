import { createFileRoute, Link } from "@tanstack/react-router";
import { projectService } from "../lib/services/project.service";
import { profileService } from "../lib/services/profile.service";
import { useEffect, useState } from "react";
import type { Tables } from "../lib/supabase/types";

type Application = Tables<"applications">;
type Project = Tables<"projects">;

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [userProfile, setUserProfile] = useState<Tables<"profiles"> | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const profile = await profileService.getProfile();
        setUserProfile(profile);

        if (profile.account_type === "company") {
          const apps = await projectService.getApplicationsForCompany(profile.id);
          setData(apps);
        } else {
          const apps = await projectService.getFreelancerApplications(profile.id);
          setData(apps);
        }
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleStatusUpdate = async (appId: string, status: Application["status"]) => {
    try {
      await projectService.updateApplicationStatus(appId, status);
      alert(`Application ${status === 'accepted' ? 'accepted' : 'rejected'}`);
      
      // Refresh data
      if (userProfile) {
        const freshData = userProfile.account_type === "company" 
          ? await projectService.getApplicationsForCompany(userProfile.id)
          : await projectService.getFreelancerApplications(userProfile.id);
        setData(freshData);
      }
    } catch (e) {
      alert("Error updating status");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading dashboard...</div>;
  if (!userProfile) return <div className="p-6 text-center">Please sign in to view your dashboard.</div>;

  const isCompany = userProfile.account_type === "company";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile.display_name || "User"}. You are viewing as a {userProfile.account_type}.</p>
        </div>
        <div className="flex gap-3">
          {isCompany ? (
            <Link to="/projects/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
              Post Project
            </Link>
          ) : (
            <Link to="/projects" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
              Browse Projects
            </Link>
          )}
          <Link to={isCompany ? "/company-profile" : "/freelancer-profile"} className="px-4 py-2 border rounded hover:bg-gray-50 font-medium">
            Profile
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-lg">
            {isCompany ? "Incoming Applications" : "My Project Applications"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 font-medium">
              <tr>
                <th className="p-4">Project</th>
                <th className="p-4">User</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">No applications found.</td>
                </tr>
              ) : (
                data.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">
                      {isCompany ? app.projects?.title : app.projects?.title}
                    </td>
                    <td className="p-4">
                      {isCompany ? app.freelancer_profiles?.headline : "Your Application"}
                    </td>
                    <td className="p-4 font-semibold">{app.proposed_amount} ETH</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        app.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {isCompany && app.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'accepted')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Accept
                          </button>
                        </>
                      )}
                      <Link 
                        to="/projects/$projectId" 
                        params={{ projectId: isCompany ? app.projects?.id : app.project_id }}
                        className="text-blue-600 hover:underline ml-2"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
