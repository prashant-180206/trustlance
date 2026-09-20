import { createFileRoute } from "@tanstack/react-router";
import { profileService } from "../lib/services/ProfileService";
import { useEffect, useState } from "react";
import type { Tables } from "../lib/supabase/types";

type CompanyProfile = Tables<"company_profiles">;

export const Route = createFileRoute("/company-profile")({
  component: CompanyProfilePage,
});

function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company_name: "",
    description: "",
    industry: "",
    website: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const userProfile = await profileService.getProfile();
        const companyData = await profileService.getCompanyProfile(userProfile.id);
        setProfile(companyData);
        setFormData({
          company_name: companyData.company_name || "",
          description: companyData.description || "",
          industry: companyData.industry || "",
          website: companyData.website || "",
        });
      } catch (e) {
        console.error("Error loading company profile:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      const userProfile = await profileService.getProfile();
      await profileService.updateCompanyProfile(userProfile.id, formData);
      alert("Profile updated!");
    } catch (e) {
      alert("Failed to update profile");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded border shadow-sm">
      <h1 className="text-3xl font-bold mb-6">Company Profile</h1>
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Company Name</label>
          <input
            className="w-full border p-2 rounded"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="e.g. TechNova Solutions"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Industry</label>
          <input
            className="w-full border p-2 rounded"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="e.g. Blockchain Development"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Website</label>
          <input
            className="w-full border p-2 rounded"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://company.com"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            className="w-full border p-2 rounded h-32"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell us about your company..."
          />
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
