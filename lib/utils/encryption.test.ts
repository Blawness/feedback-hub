import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './encryption';

describe('Encryption Utility', () => {
  const secretKey = 'a'.repeat(32); // 32 characters key
  const text = 'test-api-key-123';

  it('should encrypt and decrypt text correctly', () => {
    const encrypted = encrypt(text, secretKey);
    expect(encrypted).not.toBe(text);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = decrypt(encrypted, secretKey);
    expect(decrypted).toBe(text);
  });

  it('should throw error for invalid key length', () => {
    const shortKey = 'too-short';
    expect(() => encrypt(text, shortKey)).toThrow(/exactly 32 characters/);
  });

  it('should throw error for invalid encrypted format', () => {
    expect(() => decrypt('invalid-format', secretKey)).toThrow(/Invalid encrypted data format/);
  });

  it('should fail to decrypt with wrong key (AES-GCM throws on auth tag mismatch)', () => {
    const encrypted = encrypt(text, secretKey);
    const wrongKey = 'b'.repeat(32);
    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });
});
