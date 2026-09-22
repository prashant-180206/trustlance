import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
    useCompanyProfile,
    useUpdateCompanyProfile,
} from "../../../hooks/profile.hooks";

import { useAuth } from "../../../hooks/provider/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";



export const Route = createFileRoute("/company/profile/update")({
    component: CompanyProfileNew,
});

function CompanyProfileNew() {
    const navigate = useNavigate();

    const { user } = useAuth();
    const profileId = user?.id ?? "";

    const {
        data: profile,
        isLoading,
        error: profileError,
    } = useCompanyProfile(profileId);

    const update = useUpdateCompanyProfile();

    const [companyName, setCompanyName] = useState("");
    const [description, setDescription] = useState("");
    const [industry, setIndustry] = useState("");
    const [website, setWebsite] = useState("");

    /*
     * Populate form when profile is loaded.
     */
    useEffect(() => {
        if (!profile) return;

        setCompanyName(profile.company_name);
        setDescription(profile.description ?? "");
        setIndustry(profile.industry ?? "");
        setWebsite(profile.website ?? "");
    }, [profile]);

    if (isLoading) {
        return (
            <div className="mx-auto w-full max-w-3xl px-6 py-8">
                <div className="space-y-2">
                    <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
                    <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
                </div>

                <div className="mt-8 h-125 animate-pulse rounded-xl bg-muted" />
            </div>
        );
    }

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!profileId || !companyName.trim()) {
            return;
        }

        update.mutate(
            {
                profileId,

                updates: {
                    company_name: companyName.trim(),

                    description:
                        description.trim() || null,

                    industry:
                        industry.trim() || null,

                    website:
                        website.trim() || null,
                },
            },
            {
                onSuccess: () => {
                    navigate({
                        to: "/company/profile",
                    });
                },
            },
        );
    }

    return (
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {profile
                        ? "Edit company profile"
                        : "Create company profile"}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    Update the information displayed on your
                    TrustLance company profile.
                </p>
            </div>

            {/* Error */}
            {(profileError || update.error) && (
                <Alert
                    variant="destructive"
                    className="mb-6"
                >
                    <AlertDescription>
                        {update.error?.message ??
                            profileError?.message ??
                            "Something went wrong."}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Company information</CardTitle>

                    <CardDescription>
                        Tell freelancers about your company and the
                        type of work you do.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {/* Company name */}
                        <div className="space-y-2">
                            <Label htmlFor="company-name">
                                Company name
                            </Label>

                            <Input
                                id="company-name"
                                value={companyName}
                                onChange={(event) =>
                                    setCompanyName(
                                        event.target.value,
                                    )
                                }
                                placeholder="Acme Inc."
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description
                            </Label>

                            <Textarea
                                id="description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="Tell freelancers about your company..."
                                className="min-h-32 resize-y"
                            />

                            <p className="text-xs text-muted-foreground">
                                Give freelancers a short overview
                                of your company.
                            </p>
                        </div>

                        {/* Industry */}
                        <div className="space-y-2">
                            <Label htmlFor="industry">
                                Industry
                            </Label>

                            <Input
                                id="industry"
                                value={industry}
                                onChange={(event) =>
                                    setIndustry(
                                        event.target.value,
                                    )
                                }
                                placeholder="Software & Technology"
                            />
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <Label htmlFor="website">
                                Website
                            </Label>

                            <Input
                                id="website"
                                type="url"
                                value={website}
                                onChange={(event) =>
                                    setWebsite(
                                        event.target.value,
                                    )
                                }
                                placeholder="https://example.com"
                            />
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                
                            >
                                <Link to="/company/profile">
                                    Cancel
                                </Link>
                            </Button>

                            <Button
                                type="submit"
                                disabled={
                                    update.isPending ||
                                    !companyName.trim()
                                }
                            >
                                {update.isPending
                                    ? "Saving..."
                                    : "Save changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}