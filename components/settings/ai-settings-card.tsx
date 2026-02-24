"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateAiSettingsAction } from "@/lib/actions/ai-settings";
import { toast } from "sonner";
import { Loader2, Key, Info, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const [isLoading, setIsLoading] = useState(false);

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

          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="w-full space-y-4">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-start">
                Advanced Model Settings
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 rounded-md border p-4">
                <div className="space-y-4">
                  <Label htmlFor="model-select">Model Name</Label>
                  <Input 
                    id="model-name"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. gemini-2.0-flash"
                  />
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
