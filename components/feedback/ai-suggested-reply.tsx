"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Copy, Check, RefreshCw } from "lucide-react";
import { generateSuggestedReplyAction } from "@/lib/actions/ai";

interface AISuggestedReplyProps {
    feedbackId: string;
}

export function AISuggestedReply({ feedbackId }: AISuggestedReplyProps) {
    const [reply, setReply] = useState<string | null>(null);
    const [isGenerating, startTransition] = useTransition();
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleGenerate() {
        setError(null);
        startTransition(async () => {
            const result = await generateSuggestedReplyAction(feedbackId);
            if (result.error) {
                setError(result.error);
            } else if (result.reply) {
                setReply(result.reply);
            }
        });
    }

    async function handleCopy() {
        if (!reply) return;
        await navigator.clipboard.writeText(reply);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    return (
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    AI Suggested Reply
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!reply && !error && (
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        variant="outline"
                        size="sm"
                        className="w-full border-violet-300 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3 w-3 mr-2" />
                                Generate Reply with AI
                            </>
                        )}
                    </Button>
                )}

                {error && (
                    <div className="space-y-2">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button onClick={handleGenerate} variant="outline" size="sm">
                            Try Again
                        </Button>
                    </div>
                )}

                {reply && (
                    <div className="space-y-3">
                        <div className="rounded-lg bg-white dark:bg-gray-900 border p-3">
                            <p className="text-sm whitespace-pre-wrap">{reply}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="h-3 w-3 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3 mr-2" />
                                        Copy Reply
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                variant="ghost"
                                size="sm"
                            >
                                <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
