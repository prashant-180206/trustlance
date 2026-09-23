import { AlertCircleIcon } from "lucide-react"

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

export function ErrorMessage({ error }: { error: Error | null }) {
    if (!error) return null;
    return (
        <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon />
            <AlertTitle>{error?.name || "Error"}</AlertTitle>
            <AlertDescription>
                {error?.message || "An unexpected error occurred."}
            </AlertDescription>
        </Alert>
    )
}
