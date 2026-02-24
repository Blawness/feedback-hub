import { AiSettingsCard } from "@/components/settings/ai-settings-card";
import { getAiSettingsAction } from "@/lib/actions/ai-settings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Settings - Feedback Hub",
  description: "Configure AI providers and API keys.",
};

export default async function AiSettingsPage() {
  const result = await getAiSettingsAction();

  const settings = {
    aiProvider: "aiProvider" in result ? result.aiProvider ?? "gemini" : "gemini",
    hasGeminiKey: "hasGeminiKey" in result ? result.hasGeminiKey ?? false : false,
    hasOpenRouterKey: "hasOpenRouterKey" in result ? result.hasOpenRouterKey ?? false : false,
    error: "error" in result ? result.error : undefined,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Settings</h2>
        <p className="text-muted-foreground">
          Configure your preferred AI engine and securely manage API keys.
        </p>
      </div>
      <AiSettingsCard initialSettings={settings} />
    </div>
  );
}
