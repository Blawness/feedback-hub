import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateAiSettingsAction, getAiSettingsAction } from './ai-settings';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/encryption';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiSettings: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock encryption to avoid env dependency in tests
vi.mock('@/lib/utils/encryption', () => ({
  encrypt: vi.fn((text) => `encrypted:${text}`),
  decrypt: vi.fn((text) => text.replace('encrypted:', '')),
}));

describe('AI Settings Actions', () => {
  const encryptionKey = 'a'.repeat(32);
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = encryptionKey;
  });

  describe('updateAiSettingsAction', () => {
    it('should encrypt keys and upsert settings', async () => {
      const data = {
        aiProvider: 'gemini',
        geminiKey: 'sk-123',
      };

      vi.mocked(prisma.aiSettings.upsert).mockResolvedValue({} as any);

      const result = await updateAiSettingsAction(data);

      expect(result).toEqual({ success: true });
      expect(encrypt).toHaveBeenCalledWith('sk-123', encryptionKey);
      expect(prisma.aiSettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
        update: expect.objectContaining({
          aiProvider: 'gemini',
          encryptedGeminiKey: 'encrypted:sk-123',
        }),
      }));
    });

    it('should return error if encryption key is missing', async () => {
      delete process.env.ENCRYPTION_KEY;
      const result = await updateAiSettingsAction({ aiProvider: 'gemini' });
      expect(result).toHaveProperty('error');
    });
  });

  describe('getAiSettingsAction', () => {
    it('should return masked settings', async () => {
      vi.mocked(prisma.aiSettings.findUnique).mockResolvedValue({
        aiProvider: 'openrouter',
        encryptedGeminiKey: 'enc1',
        encryptedOpenRouterKey: 'enc2',
      } as any);

      const result = await getAiSettingsAction();

      expect(result).toEqual({
        aiProvider: 'openrouter',
        hasGeminiKey: true,
        hasOpenRouterKey: true,
      });
    });

    it('should return default settings if none found', async () => {
      vi.mocked(prisma.aiSettings.findUnique).mockResolvedValue(null);
      const result = await getAiSettingsAction();
      expect(result).toEqual({
        aiProvider: 'gemini',
        hasGeminiKey: false,
        hasOpenRouterKey: false,
      });
    });
  });
});
