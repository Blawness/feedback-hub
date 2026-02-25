import { AiSettingsCard } from "@/components/settings/ai-settings-card";
import { getAiSettingsAction } from "@/lib/actions/ai-settings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Settings - Feedback Hub",
  description: "Configure AI providers and API keys.",
};

import { Suspense } from "react";

async function AiSettingsLoader() {
  const result = await getAiSettingsAction();

  const settings = {
    aiProvider: "aiProvider" in result ? result.aiProvider ?? "gemini" : "gemini",
    isEnabled: "isEnabled" in result ? result.isEnabled ?? true : true,
    hasGeminiKey: "hasGeminiKey" in result ? result.hasGeminiKey ?? false : false,
    hasOpenRouterKey: "hasOpenRouterKey" in result ? result.hasOpenRouterKey ?? false : false,
    model: "model" in result ? result.model ?? "gemini-2.0-flash" : "gemini-2.0-flash",
    temperature: "temperature" in result ? result.temperature ?? 0.7 : 0.7,
    maxOutputTokens: "maxOutputTokens" in result ? result.maxOutputTokens ?? 2048 : 2048,
    topP: "topP" in result ? result.topP ?? 0.95 : 0.95,
    topK: "topK" in result ? result.topK ?? 40 : 40,
    masterPrompt: "masterPrompt" in result ? result.masterPrompt ?? "" : "",
    error: "error" in result ? result.error : undefined,
  };

  return <AiSettingsCard initialSettings={settings} />;
}

export default function AiSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Settings</h2>
        <p className="text-muted-foreground">
          Configure your preferred AI engine and securely manage API keys.
        </p>
      </div>
      <Suspense fallback={<div className="h-[500px] rounded-xl border bg-card text-card-foreground shadow animate-pulse" />}>
        <AiSettingsLoader />
      </Suspense>
    </div>
  );
}
