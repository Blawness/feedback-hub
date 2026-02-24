import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiSettingsCard } from "../ai-settings-card";
import { updateAiSettingsAction } from "@/lib/actions/ai-settings";
import { toast } from "sonner";

// Mock the server action
vi.mock("@/lib/actions/ai-settings", () => ({
  updateAiSettingsAction: vi.fn(),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AiSettingsCard", () => {
  const initialSettings = {
    aiProvider: "gemini",
    hasGeminiKey: true,
    hasOpenRouterKey: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with initial settings", () => {
    render(<AiSettingsCard initialSettings={initialSettings} />);

    expect(screen.getByText("AI Provider Configuration")).toBeInTheDocument();
    expect(screen.getByText("Google Gemini")).toBeInTheDocument();
    expect(screen.getByText("OpenRouter")).toBeInTheDocument();
    
    // Check for masked key indicator
    expect(screen.getByPlaceholderText("••••••••••••••••")).toBeInTheDocument();
  });

  it("allows changing the provider", () => {
    render(<AiSettingsCard initialSettings={initialSettings} />);
    
    const openRouterText = screen.getByText("OpenRouter");
    fireEvent.click(openRouterText);
  });

  it("calls updateAiSettingsAction on save", async () => {
    vi.mocked(updateAiSettingsAction).mockResolvedValue({ success: true });

    render(<AiSettingsCard initialSettings={initialSettings} />);
    
    const geminiInput = screen.getByLabelText(/Gemini API Key/);
    fireEvent.change(geminiInput, { target: { value: "new-key" } });
    
    const saveButton = screen.getByText("Save AI Configuration");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateAiSettingsAction).toHaveBeenCalledWith(expect.objectContaining({
        geminiKey: "new-key",
      }));
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("handles errors during save", async () => {
    vi.mocked(updateAiSettingsAction).mockResolvedValue({ error: "Failed to save" });

    render(<AiSettingsCard initialSettings={initialSettings} />);
    
    const saveButton = screen.getByText("Save AI Configuration");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to save");
    });
  });
});
