"use client";

import { useState, useCallback } from "react";
import { IdeaGenerationConfig } from "@/lib/actions/idea-pool";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Settings2 } from "lucide-react";

interface GenerationConfigProps {
    config: IdeaGenerationConfig;
    onChange: (config: IdeaGenerationConfig) => void;
}

const categories = [
    "Any",
    "SaaS",
    "Landing Page",
    "Web App",
    "Mobile App",
    "CLI Tool",
    "Browser Extension",
    "API Service",
    "E-commerce",
    "Social Media",
    "AI/ML Tool"
];

const difficulties = ["Any", "Beginner", "Intermediate", "Advanced"];

export function GenerationConfig({ config, onChange }: GenerationConfigProps) {
    const [liveValue, setLiveValue] = useState(config.count || 3);
    const [isDragging, setIsDragging] = useState(false);

    const displayValue = isDragging ? Math.round(liveValue) : (config.count || 3);

    const handleSliderChange = useCallback(([val]: number[]) => {
        setIsDragging(true);
        setLiveValue(val);
    }, []);

    const handleSliderCommit = useCallback(([val]: number[]) => {
        const snapped = Math.round(val);
        setLiveValue(snapped);
        setIsDragging(false);
        onChange({ ...config, count: snapped });
    }, [config, onChange]);

    return (
        <Card className="bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 mb-6">
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Settings2 className="h-4 w-4" />
                    Generation Preferences
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={config.category || "Any"}
                            onValueChange={(val) => onChange({ ...config, category: val === "Any" ? undefined : val })}
                        >
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select
                            value={config.difficulty || "Any"}
                            onValueChange={(val) => onChange({ ...config, difficulty: val === "Any" ? undefined : val })}
                        >
                            <SelectTrigger id="difficulty">
                                <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                {difficulties.map(diff => (
                                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="count" className="text-sm font-medium">Number of Ideas</Label>
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-md text-xs font-bold tabular-nums transition-all duration-200">
                                {displayValue}
                            </span>
                        </div>
                        <div className="px-1 pt-2">
                            <Slider
                                id="count"
                                min={1}
                                max={9}
                                step={0.01}
                                value={isDragging ? [liveValue] : [config.count || 3]}
                                onValueChange={handleSliderChange}
                                onValueCommit={handleSliderCommit}
                                className="cursor-pointer smooth-slider"
                            />
                            <div className="flex justify-between mt-2 px-0.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setLiveValue(i);
                                            setIsDragging(false);
                                            onChange({ ...config, count: i });
                                        }}
                                        className={`text-[10px] font-medium transition-colors duration-150 hover:text-blue-500 cursor-pointer ${displayValue === i
                                            ? "text-blue-600 dark:text-blue-400 font-bold"
                                            : "text-gray-400 dark:text-gray-600"
                                            }`}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
