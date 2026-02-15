"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, X } from "lucide-react";
import { semanticSearchAction } from "@/lib/actions/ai";
import type { SemanticSearchResult } from "@/lib/ai/types";
import Link from "next/link";

export function AISearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SemanticSearchResult[]>([]);
    const [isSearching, startTransition] = useTransition();
    const [hasSearched, setHasSearched] = useState(false);

    function handleSearch() {
        if (!query.trim()) return;

        startTransition(async () => {
            const result = await semanticSearchAction(query);
            if (result.results) {
                setResults(result.results);
                setHasSearched(true);
            }
        });
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    }

    function handleClear() {
        setQuery("");
        setResults([]);
        setHasSearched(false);
    }

    return (
        <div className="space-y-3">
            <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="AI search: describe what you're looking for..."
                    className="pl-9 pr-9 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    disabled={isSearching}
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isSearching && (
                <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Searching with AI...
                </div>
            )}

            {hasSearched && results.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                    No relevant feedbacks found for your query.
                </p>
            )}

            {results.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.map((result) => (
                        <Link
                            key={result.feedbackId}
                            href={`/feedback/${result.feedbackId}`}
                            className="block rounded-lg border hover:border-violet-300 dark:hover:border-violet-700 p-3 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium truncate">
                                    {result.feedbackId}
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 text-xs shrink-0"
                                >
                                    {Math.round(result.relevanceScore * 100)}% match
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {result.reason}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
