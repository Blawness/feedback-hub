import { SettingsClient } from "@/components/settings/settings-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings - Feedback Hub",
    description: "Manage application settings and integrations.",
};

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage GitHub sync, user preferences, and integrations.
                </p>
            </div>
            <SettingsClient />
        </div>
    );
}
