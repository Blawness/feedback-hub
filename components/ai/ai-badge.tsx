"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIBadgeProps {
    aiSummary?: string | null;
    aiSuggestedType?: string | null;
    aiSuggestedPriority?: string | null;
    aiConfidence?: number | null;
}

export function AIBadge({
    aiSummary,
    aiSuggestedType,
    aiSuggestedPriority,
    aiConfidence,
}: AIBadgeProps) {
    if (!aiConfidence) return null;

    const confidencePercent = Math.round(aiConfidence * 100);

    const confidenceColor =
        aiConfidence >= 0.8
            ? "text-green-600 dark:text-green-400"
            : aiConfidence >= 0.5
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-red-600 dark:text-red-400";

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="secondary"
                        className="gap-1 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900 cursor-help"
                    >
                        <Sparkles className="h-3 w-3" />
                        AI {confidencePercent}%
                    </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1.5">
                        <p className="font-semibold text-xs">AI Analysis</p>
                        {aiSummary && (
                            <p className="text-xs">{aiSummary}</p>
                        )}
                        <div className="flex gap-2 text-xs">
                            {aiSuggestedType && (
                                <span>
                                    Type: <span className="capitalize font-medium">{aiSuggestedType}</span>
                                </span>
                            )}
                            {aiSuggestedPriority && (
                                <span>
                                    Priority: <span className="capitalize font-medium">{aiSuggestedPriority}</span>
                                </span>
                            )}
                        </div>
                        <p className={`text-xs ${confidenceColor}`}>
                            Confidence: {confidencePercent}%
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
