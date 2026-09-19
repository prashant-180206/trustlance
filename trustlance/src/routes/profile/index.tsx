// src/pages/ProfilePage.tsx

import { useEffect, useState } from "react";
import { profileService } from "../../lib/services/ProfileService";
import { useAuth } from "../../hooks/provider/AuthProvider";
import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/profile/")({
    component: ProfilePage,
});

function ProfilePage() {
    const { signOut } = useAuth();

    const [profile, setProfile] =
        useState<any>(null);

    const [loading, setLoading] =
        useState(true);

    const [name, setName] =
        useState("");

    useEffect(() => {
        profileService
            .getProfile()
            .then((profile) => {
                setProfile(profile);
                setName(profile.display_name ?? "");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    async function saveProfile() {
        const updated =
            await profileService.updateProfile({
                display_name: name,
            });

        setProfile(updated);
    }

    if (loading) {
        return <div>Loading profile...</div>;
    }

    return (
        <div>
            <h1>My Profile</h1>

            <p>
                Wallet / User ID:
                <br />
                {profile.id}
            </p>

            <div>
                <label>
                    Display name
                </label>

                <input
                    value={name}
                    onChange={(event) =>
                        setName(event.target.value)
                    }
                />
            </div>

            <button onClick={saveProfile}>
                Save Profile
            </button>

            <button onClick={signOut}>
                Sign Out
            </button>
        </div>
    );
}