"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    RefreshCw,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
} from "lucide-react";
import { generateDashboardInsightsAction } from "@/lib/actions/ai";
import type { DashboardInsight } from "@/lib/ai/types";

const CATEGORY_CONFIG: Record<
    string,
    { icon: React.ReactNode; color: string; badgeClass: string }
> = {
    trend: {
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-blue-600 dark:text-blue-400",
        badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    alert: {
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "text-orange-600 dark:text-orange-400",
        badgeClass: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    },
    suggestion: {
        icon: <Lightbulb className="h-4 w-4" />,
        color: "text-green-600 dark:text-green-400",
        badgeClass: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    },
};

export function AIInsightsCard() {
    const [insights, setInsights] = useState<DashboardInsight[]>([]);
    const [isLoading, startTransition] = useTransition();
    const [hasGenerated, setHasGenerated] = useState(false);

    function handleGenerate() {
        startTransition(async () => {
            const result = await generateDashboardInsightsAction();
            if (result.insights) {
                setInsights(result.insights);
                setHasGenerated(true);
            }
        });
    }

    return (
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-500" />
                        AI Insights
                    </CardTitle>
                    {hasGenerated && (
                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                        >
                            <RefreshCw
                                className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                            />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!hasGenerated && (
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="w-full border-violet-300 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                Analyzing feedbacks...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3 w-3 mr-2" />
                                Generate AI Insights
                            </>
                        )}
                    </Button>
                )}

                {hasGenerated && insights.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No insights available yet. Add more feedbacks to get started.
                    </p>
                )}

                {insights.length > 0 && (
                    <div className="space-y-3">
                        {insights.map((insight, index) => {
                            const config = CATEGORY_CONFIG[insight.category] || CATEGORY_CONFIG.suggestion;
                            return (
                                <div
                                    key={index}
                                    className="rounded-lg border bg-white dark:bg-gray-900 p-3 space-y-1.5"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className={config.color}>{config.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-medium">{insight.title}</h4>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] px-1.5 py-0 ${config.badgeClass}`}
                                                >
                                                    {insight.category}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {insight.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
