"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Code, Target, Zap, Pencil } from "lucide-react";

export interface IdeaCardProps {
    id?: string;
    title: string;
    description: string;
    category: string;
    techStack: string[];
    difficulty: string;
    audience: string;
    features: string[];
    isSaved?: boolean;
    onSave?: () => void;
    onUnsave?: () => void;
    onEdit?: () => void;
    isLoading?: boolean;
}

export function IdeaCard({
    title,
    description,
    category,
    techStack,
    difficulty,
    audience,
    features,
    isSaved = false,
    onSave,
    onUnsave,
    onEdit,
    isLoading = false,
}: IdeaCardProps) {

    // Determine difficulty color map
    const difficultyColorMap: Record<string, string> = {
        "Beginner": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
        "Intermediate": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
        "Advanced": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    };

    const difficultyClass = difficultyColorMap[difficulty] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";

    return (
        <Card className="flex flex-col h-full bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                        <CardTitle className="text-xl leading-tight">{title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        {category}
                    </Badge>
                    <Badge variant="outline" className={difficultyClass}>
                        {difficulty}
                    </Badge>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                            <Code className="h-4 w-4 text-gray-500" />
                            Tech Stack
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {techStack.map((tech) => (
                                <span key={tech} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                            <Target className="h-4 w-4 text-gray-500" />
                            Target Audience
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {audience}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                            <Zap className="h-4 w-4 text-gray-500" />
                            Key Features
                        </div>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4 marker:text-gray-400">
                            {features.map((feature, i) => (
                                <li key={i}>{feature}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0 pb-4">
                {isSaved ? (
                    <div className="flex gap-2 w-full">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                            onClick={onUnsave}
                            disabled={isLoading}
                        >
                            <BookmarkCheck className="h-4 w-4 mr-2" />
                            Saved
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                            onClick={onEdit}
                            disabled={isLoading}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={onSave}
                        disabled={isLoading}
                    >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save Idea
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
