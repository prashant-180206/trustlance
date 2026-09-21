import { createFileRoute } from "@tanstack/react-router";
import { profileService } from "../lib/services/profile.service";
import { useEffect, useState } from "react";
import type { Tables } from "../lib/supabase/types";

type FreelancerProfile = Tables<"freelancer_profiles">;

export const Route = createFileRoute("/freelancer-profile")({
  component: FreelancerProfilePage,
});

function FreelancerProfilePage() {
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    headline: "",
    bio: "",
    experience: "",
    hourly_rate: 0,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const userProfile = await profileService.getProfile();
        const freelancerData = await profileService.getFreelancerProfile(userProfile.id);
        setProfile(freelancerData);
        setFormData({
          headline: freelancerData.headline || "",
          bio: freelancerData.bio || "",
          experience: freelancerData.experience || "",
          hourly_rate: freelancerData.hourly_rate || 0,
        });
      } catch (e) {
        console.error("Error loading freelancer profile:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      const userProfile = await profileService.getProfile();
      await profileService.updateFreelancerProfile(userProfile.id, formData);
      alert("Profile updated!");
    } catch (e) {
      alert("Failed to update profile");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded border shadow-sm">
      <h1 className="text-3xl font-bold mb-6">Freelancer Profile</h1>
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Headline</label>
          <input
            className="w-full border p-2 rounded"
            value={formData.headline}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            placeholder="e.g. Expert Solidity Developer"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Bio</label>
          <textarea
            className="w-full border p-2 rounded h-32"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Experience</label>
          <textarea
            className="w-full border p-2 rounded h-24"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            placeholder="Key projects and achievements..."
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Hourly Rate (ETH)</label>
          <input
            type="number"
            step="0.001"
            className="w-full border p-2 rounded"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
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
