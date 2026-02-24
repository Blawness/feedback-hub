import { AiSettingsCard } from "@/components/settings/ai-settings-card";
import { getAiSettingsAction } from "@/lib/actions/ai-settings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Settings - Feedback Hub",
  description: "Configure AI providers and API keys.",
};

export default async function AiSettingsPage() {
  const settings = await getAiSettingsAction();

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
