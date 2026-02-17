"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Github, CheckCircle2 } from "lucide-react";
import { syncProjects } from "@/lib/actions/projects";
import { AiSettingsCard } from "@/components/settings/ai-settings-card";

export function SettingsClient() {
    const [isPending, startTransition] = useTransition();
    const [syncResult, setSyncResult] = useState<{
        success: boolean;
        count?: number;
        error?: string;
    } | null>(null);

    function handleSync() {
        startTransition(async () => {
            const result = await syncProjects();
            setSyncResult(result);
        });
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Github className="h-5 w-5" />
                            GitHub Integration
                        </CardTitle>
                        <CardDescription>
                            Sync your GitHub repositories as projects. Each repo gets a unique API key.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">Username: Blawness</Badge>
                        </div>

                        <Button onClick={handleSync} disabled={isPending}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                            {isPending ? "Syncing..." : "Sync Repositories"}
                        </Button>

                        {syncResult && (
                            <div
                                className={`rounded-lg border p-3 text-sm ${syncResult.success
                                    ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    }`}
                            >
                                {syncResult.success ? (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Synced {syncResult.count} repositories successfully!
                                    </span>
                                ) : (
                                    <span>Error: {syncResult.error}</span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>API Usage</CardTitle>
                        <CardDescription>
                            Use the REST API to send feedback from your applications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Example Request</p>
                            <pre className="text-xs overflow-auto whitespace-pre-wrap">
                                {`POST https://feedback-hub-seven.vercel.app/api/v1/feedback
Content-Type: application/json
FEEDBACK_API_KEY: <your-project-api-key>

{
  "title": "Bug report",
  "description": "Something broke",
  "type": "bug",
  "priority": "high",
  "metadata": {
    "browser": "Chrome",
    "page": "/dashboard"
  }
}`}
                            </pre>
                        </div>
                        <div className="text-sm space-y-1 text-muted-foreground">
                            <p><code className="text-xs bg-muted px-1 py-0.5 rounded">GET /api/v1/health</code> — Health check</p>
                            <p><code className="text-xs bg-muted px-1 py-0.5 rounded">POST /api/v1/feedback</code> — Submit feedback</p>
                            <p><code className="text-xs bg-muted px-1 py-0.5 rounded">GET /api/v1/feedback</code> — List feedback</p>
                            <p><code className="text-xs bg-muted px-1 py-0.5 rounded">POST /api/v1/tasks</code> — Create task</p>
                            <p><code className="text-xs bg-muted px-1 py-0.5 rounded">GET /api/v1/tasks</code> — List tasks</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AiSettingsCard />
        </div>
    );
}

