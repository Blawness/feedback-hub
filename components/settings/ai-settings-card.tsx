"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Brain, Save, RotateCcw, Sparkles, Languages, SlidersHorizontal, FileText } from "lucide-react";
import { toast } from "sonner";
import { getAiSettings, updateAiSettings, resetAiSettings } from "@/lib/actions/ai-settings";
import type { AiSettingsInput } from "@/lib/actions/ai-settings";
import { PROMPT_TEMPLATES, getTemplateById } from "@/lib/ai/prompt-templates";

const LANGUAGES = [
    { value: "auto", label: "Auto-detect" },
    { value: "en", label: "English" },
    { value: "id", label: "Bahasa Indonesia" },
    { value: "ja", label: "日本語 (Japanese)" },
    { value: "ko", label: "한국어 (Korean)" },
    { value: "zh", label: "中文 (Chinese)" },
    { value: "es", label: "Español (Spanish)" },
] as const;

const MODELS = [
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Fast & capable" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", description: "Fastest, lightweight" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Latest, smartest" },
] as const;

export function AiSettingsCard() {
    const [isPending, startTransition] = useTransition();
    const [isLoaded, setIsLoaded] = useState(false);

    const [language, setLanguage] = useState("auto");
    const [model, setModel] = useState("gemini-2.0-flash");
    const [temperature, setTemperature] = useState(0.7);
    const [maxOutputTokens, setMaxOutputTokens] = useState(2048);
    const [topP, setTopP] = useState(0.95);
    const [topK, setTopK] = useState(40);
    const [masterPrompt, setMasterPrompt] = useState("");
    const [templateId, setTemplateId] = useState("default");

    // Load settings on mount
    useEffect(() => {
        getAiSettings().then((settings) => {
            setLanguage(settings.language);
            setModel(settings.model);
            setTemperature(settings.temperature);
            setMaxOutputTokens(settings.maxOutputTokens);
            setTopP(settings.topP);
            setTopK(settings.topK);
            setMasterPrompt(settings.masterPrompt || "");
            setTemplateId(settings.templateId || "default");
            setIsLoaded(true);
        });
    }, []);

    function handleTemplateChange(id: string) {
        setTemplateId(id);
        const template = getTemplateById(id);
        if (template) {
            setMasterPrompt(template.systemInstruction);
        }
    }

    function handleSave() {
        startTransition(async () => {
            const data: AiSettingsInput = {
                language,
                model,
                temperature,
                maxOutputTokens,
                topP,
                topK,
                masterPrompt: masterPrompt.trim() || null,
                templateId,
            };

            const result = await updateAiSettings(data);

            if (result.success) {
                toast.success("AI settings saved successfully!");
            } else {
                toast.error("Failed to save settings.");
            }
        });
    }

    function handleReset() {
        startTransition(async () => {
            const result = await resetAiSettings();

            if (result.success && result.settings) {
                setLanguage(result.settings.language);
                setModel(result.settings.model);
                setTemperature(result.settings.temperature);
                setMaxOutputTokens(result.settings.maxOutputTokens);
                setTopP(result.settings.topP);
                setTopK(result.settings.topK);
                setMasterPrompt(result.settings.masterPrompt || "");
                setTemplateId(result.settings.templateId || "default");
                toast.success("Settings reset to defaults.");
            }
        });
    }

    if (!isLoaded) {
        return (
            <Card className="col-span-full">
                <CardContent className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Brain className="h-5 w-5 animate-pulse" />
                        <span>Loading AI settings...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Settings
                </CardTitle>
                <CardDescription>
                    Configure AI language, model parameters, and master prompt for all AI features.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* ── Language & Model ── */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-4 w-4" />
                        Language & Model
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ai-language">Response Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger id="ai-language">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.value} value={lang.value}>
                                            {lang.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai-model">AI Model</Label>
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger id="ai-model">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODELS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            <div className="flex flex-col">
                                                <span>{m.label}</span>
                                                <span className="text-xs text-muted-foreground">{m.description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* ── Parameters ── */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <SlidersHorizontal className="h-4 w-4" />
                        Generation Parameters
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {/* Temperature */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Temperature</Label>
                                <span className="text-sm font-mono text-muted-foreground">{temperature.toFixed(2)}</span>
                            </div>
                            <Slider
                                value={[temperature]}
                                onValueChange={([v]) => setTemperature(v)}
                                min={0}
                                max={2}
                                step={0.05}
                            />
                            <p className="text-xs text-muted-foreground">
                                Lower = more focused, Higher = more creative
                            </p>
                        </div>

                        {/* Max Output Tokens */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Max Output Tokens</Label>
                                <span className="text-sm font-mono text-muted-foreground">{maxOutputTokens}</span>
                            </div>
                            <Slider
                                value={[maxOutputTokens]}
                                onValueChange={([v]) => setMaxOutputTokens(v)}
                                min={256}
                                max={8192}
                                step={256}
                            />
                            <p className="text-xs text-muted-foreground">
                                Maximum tokens in AI response
                            </p>
                        </div>

                        {/* Top P */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Top P</Label>
                                <span className="text-sm font-mono text-muted-foreground">{topP.toFixed(2)}</span>
                            </div>
                            <Slider
                                value={[topP]}
                                onValueChange={([v]) => setTopP(v)}
                                min={0}
                                max={1}
                                step={0.05}
                            />
                            <p className="text-xs text-muted-foreground">
                                Nucleus sampling — controls diversity
                            </p>
                        </div>

                        {/* Top K */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Top K</Label>
                                <span className="text-sm font-mono text-muted-foreground">{topK}</span>
                            </div>
                            <Slider
                                value={[topK]}
                                onValueChange={([v]) => setTopK(v)}
                                min={1}
                                max={100}
                                step={1}
                            />
                            <p className="text-xs text-muted-foreground">
                                Number of top tokens to consider
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* ── Prompt Template ── */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4" />
                        Prompt Template
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ai-template">Select Template</Label>
                        <Select value={templateId} onValueChange={handleTemplateChange}>
                            <SelectTrigger id="ai-template">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PROMPT_TEMPLATES.map((tpl) => (
                                    <SelectItem key={tpl.id} value={tpl.id}>
                                        <div className="flex flex-col">
                                            <span>{tpl.name}</span>
                                            <span className="text-xs text-muted-foreground">{tpl.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                {/* ── Custom Master Prompt ── */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4" />
                        Custom Master Prompt
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This prompt is prepended to every AI request. Selecting a template above will auto-fill this field, but you can customize it further.
                    </p>
                    <Textarea
                        value={masterPrompt}
                        onChange={(e) => setMasterPrompt(e.target.value)}
                        placeholder="Enter a custom system instruction for the AI..."
                        rows={6}
                        className="font-mono text-sm"
                    />
                </div>

                <Separator />

                {/* ── Actions ── */}
                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? "Saving..." : "Save Settings"}
                    </Button>
                    <Button variant="outline" onClick={handleReset} disabled={isPending}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset to Defaults
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
