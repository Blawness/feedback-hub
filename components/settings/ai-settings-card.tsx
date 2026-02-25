"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateAiSettingsAction, testAiConnectionAction, getOpenRouterModelsAction } from "@/lib/actions/ai-settings";
import { toast } from "sonner";
import { Loader2, Key, Info, CheckCircle2, Zap, Clock, Hash, MessageSquare, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AiSettingsCardProps {
  initialSettings: {
    aiProvider: string;
    isEnabled: boolean;
    hasGeminiKey: boolean;
    hasOpenRouterKey: boolean;
    model: string;
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
    masterPrompt: string;
    error?: string;
  };
}

export function AiSettingsCard({ initialSettings }: AiSettingsCardProps) {
  const [isEnabled, setIsEnabled] = useState(initialSettings.isEnabled);
  const [provider, setProvider] = useState(initialSettings.aiProvider || "gemini");
  const [geminiKey, setGeminiKey] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");

  // Advanced Settings
  const [model, setModel] = useState(initialSettings.model);
  const [temperature, setTemperature] = useState(initialSettings.temperature);
  const [maxOutputTokens, setMaxOutputTokens] = useState(initialSettings.maxOutputTokens);
  const [topP, setTopP] = useState(initialSettings.topP);
  const [topK, setTopK] = useState(initialSettings.topK);
  const [masterPrompt, setMasterPrompt] = useState(initialSettings.masterPrompt);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [openRouterModels, setOpenRouterModels] = useState<{ id: string; name: string }[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  useEffect(() => {
    if (provider === "openrouter" && isAdvancedOpen && openRouterModels.length === 0) {
      const fetchModels = async () => {
        setIsFetchingModels(true);
        try {
          const models = await getOpenRouterModelsAction();
          setOpenRouterModels(models);
        } catch (error) {
          console.error("Failed to fetch models", error);
        } finally {
          setIsFetchingModels(false);
        }
      };
      fetchModels();
    }
  }, [provider, isAdvancedOpen, openRouterModels.length]);

  const geminiModels = [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Preview)" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  ];

  const currentModels = provider === "gemini" ? geminiModels : openRouterModels;

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    provider?: string;
    model?: string;
    response?: string;
    tokenUsage?: { prompt: number; completion: number; total: number };
    error?: string;
  } | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateAiSettingsAction({
        aiProvider: provider,
        isEnabled,
        geminiKey: geminiKey || undefined,
        openRouterKey: openRouterKey || undefined,
        model,
        temperature,
        maxOutputTokens,
        topP,
        topK,
        masterPrompt: masterPrompt || "",
      });

      if (result.success) {
        toast.success("AI Settings updated successfully");
        setGeminiKey("");
        setOpenRouterKey("");
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>AI Provider Configuration</CardTitle>
          <CardDescription>
            Select the AI engine used for feedback analysis, summarization, and chat.
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="ai-module-toggle" className="font-bold">AI Module</Label>
          <Switch
            id="ai-module-toggle"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {!isEnabled && (
          <Alert variant="destructive" className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>AI Module is Disabled</AlertTitle>
            <AlertDescription>
              AI features like sentiment analysis, summarization, and AI chat will be unavailable until enabled.
            </AlertDescription>
          </Alert>
        )}

        <div className={`space-y-8 ${!isEnabled ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="space-y-4">
            <Label className="text-base">Active Provider</Label>
            <RadioGroup
              value={provider}
              onValueChange={setProvider}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="gemini"
                  id="gemini"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="gemini"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold">Google Gemini</span>
                    {initialSettings.hasGeminiKey && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Direct integration with Gemini 2.0 Flash for fast and accurate results.
                  </p>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="openrouter"
                  id="openrouter"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="openrouter"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold">OpenRouter</span>
                    {initialSettings.hasOpenRouterKey && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Access a wide range of models (Claude, GPT-4, etc.) via OpenRouter proxy.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="gemini-key" className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Gemini API Key
                </Label>
                {initialSettings.hasGeminiKey && (
                  <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    Key Configured
                  </span>
                )}
              </div>
              <Input
                id="gemini-key"
                type="password"
                placeholder={initialSettings.hasGeminiKey ? "••••••••••••••••" : "Enter your Gemini API Key"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="openrouter-key" className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  OpenRouter API Key
                </Label>
                {initialSettings.hasOpenRouterKey && (
                  <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    Key Configured
                  </span>
                )}
              </div>
              <Input
                id="openrouter-key"
                type="password"
                placeholder={initialSettings.hasOpenRouterKey ? "••••••••••••••••" : "Enter your OpenRouter API Key"}
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Test Connection Section */}
          <div className="space-y-4 rounded-lg border border-dashed p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Test Connection
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send a quick ping to verify your API key and measure latency.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsTesting(true);
                  setTestResult(null);
                  try {
                    const result = await testAiConnectionAction();
                    setTestResult(result);
                  } catch {
                    setTestResult({ success: false, error: "Request failed unexpectedly." });
                  } finally {
                    setIsTesting(false);
                  }
                }}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing…
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div className="space-y-3">
                {testResult.success ? (
                  <>
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Connection successful
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Latency
                        </p>
                        <Badge variant="secondary" className="font-mono">
                          {testResult.latencyMs}ms
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" /> Model
                        </p>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {testResult.model}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Tokens
                        </p>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {testResult.tokenUsage?.prompt ?? 0} in / {testResult.tokenUsage?.completion ?? 0} out
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Response
                        </p>
                        <Badge variant="outline" className="font-mono text-xs">
                          {testResult.response}
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Failed</AlertTitle>
                    <AlertDescription className="text-sm">
                      {testResult.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="w-full space-y-4">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-start">
                Advanced Model Settings
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 rounded-md border p-4">
              <div className="space-y-4">
                <Label htmlFor="model-select">Model Name</Label>
                <div className="flex w-full">
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between font-mono"
                      >
                        {model
                          ? currentModels.find((m) => m.id === model)?.name || model
                          : "Select a model..."}
                        {isFetchingModels ? (
                          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                        ) : (
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder={`Search ${provider === "gemini" ? "Gemini" : "OpenRouter"} models...`} />
                        <CommandList>
                          <CommandEmpty>
                            {isFetchingModels ? "Loading models..." : "No model found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {currentModels.map((m) => (
                              <CommandItem
                                key={m.id}
                                value={`${m.name} ${m.id}`}
                                onSelect={() => {
                                  setModel(m.id);
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    model === m.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col text-left">
                                  <span className="font-medium">{m.name}</span>
                                  {m.name !== m.id && (
                                    <span className="text-xs text-muted-foreground whitespace-break-spaces">{m.id}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground">
                  The specific model identifier to use with the selected provider.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Temperature: {temperature}</Label>
                </div>
                <Slider
                  value={[temperature]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(val) => setTemperature(val[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values make the output more creative, lower values more deterministic.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="max-tokens">Max Output Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={maxOutputTokens}
                    onChange={(e) => setMaxOutputTokens(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="top-p">Top P</Label>
                  <Input
                    id="top-p"
                    type="number"
                    step="0.01"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="master-prompt">Master System Prompt</Label>
                <Textarea
                  id="master-prompt"
                  value={masterPrompt}
                  onChange={(e) => setMasterPrompt(e.target.value)}
                  placeholder="Global instructions for the AI..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt will be prepended to all AI requests across the application.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <Alert className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">Security Information</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Your API keys are encrypted at rest using AES-256-GCM before being stored in our database.
            They are never exposed in plain text to anyone.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save AI Configuration"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
