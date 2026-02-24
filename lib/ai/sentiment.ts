import { generateText } from "ai";
import { getAiConfig, getAiModel } from "./gemini";

/**
 * Analyzes the sentiment of a given text using Gemini via Vercel AI SDK.
 * @param text The text to analyze.
 * @returns A sentiment score between -1 (Negative) and 1 (Positive).
 */
export async function analyzeSentiment(text: string): Promise<number> {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const model = await getAiModel();
  if (!model) {
    throw new Error("AI configuration missing: API key is not set.");
  }

  const config = await getAiConfig();

  const { text: resultText } = await generateText({
    model,
    system: `You are a sentiment analysis expert. 
Analyze the sentiment of the provided feedback and return ONLY a single numerical score between -1.0 and 1.0.
-1.0 is strongly negative.
0.0 is neutral.
1.0 is strongly positive.
Do not include any other text or explanation.`,
    prompt: text,
    temperature: 0,
  });

  const score = parseFloat(resultText.trim());
  
  if (isNaN(score)) {
    console.error("AI returned non-numeric sentiment score:", resultText);
    return 0;
  }

  // Ensure score is within bounds
  return Math.max(-1, Math.min(1, score));
}
