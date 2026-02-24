import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSentiment } from './sentiment';
import { generateText } from 'ai';

// Mock the 'ai' package
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

// Mock the gemini module for model/config resolution
const mockGetAiModel = vi.fn();
const mockGetAiConfig = vi.fn();

vi.mock('./gemini', () => ({
  getAiModel: (...args: unknown[]) => mockGetAiModel(...args),
  getAiConfig: (...args: unknown[]) => mockGetAiConfig(...args),
}));

describe('analyzeSentiment', () => {
  const mockModel = { modelId: 'test-model' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAiModel.mockResolvedValue(mockModel);
    mockGetAiConfig.mockResolvedValue({
      temperature: 0.7,
      maxOutputTokens: 2048,
      systemInstruction: undefined,
    });
  });

  it('should return a positive score for positive feedback', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '0.8',
    } as any);

    const text = "This is a great feature! I love it.";
    const score = await analyzeSentiment(text);
    expect(score).toBeGreaterThan(0);
    expect(score).toBe(0.8);
  });

  it('should return a negative score for negative feedback', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '-0.9',
    } as any);

    const text = "This is terrible. It keeps crashing.";
    const score = await analyzeSentiment(text);
    expect(score).toBeLessThan(0);
    expect(score).toBe(-0.9);
  });

  it('should return a near-zero score for neutral feedback', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '0.1',
    } as any);

    const text = "The application is functional.";
    const score = await analyzeSentiment(text);
    expect(Math.abs(score)).toBeLessThan(0.3);
    expect(score).toBe(0.1);
  });

  it('should return 0 for empty text', async () => {
    const score = await analyzeSentiment("");
    expect(score).toBe(0);
  });

  it('should return 0 if AI returns invalid response', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      text: 'invalid',
    } as any);

    const score = await analyzeSentiment("some text");
    expect(score).toBe(0);
  });

  it('should throw error if AI model is not available', async () => {
    mockGetAiModel.mockResolvedValue(null);

    await expect(analyzeSentiment("text")).rejects.toThrow("AI configuration missing");
  });
});
