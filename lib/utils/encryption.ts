import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Encrypts a string using AES-256-GCM.
 * @param text The text to encrypt.
 * @param secretKey The secret key for encryption (must be 32 bytes).
 * @returns The encrypted string in the format: iv:authTag:encryptedText
 */
export function encrypt(text: string, secretKey: string): string {
  if (!secretKey || secretKey.length !== KEY_LENGTH) {
    throw new Error(`Secret key must be exactly ${KEY_LENGTH} characters long.`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with AES-256-GCM.
 * @param encryptedData The encrypted data in the format: iv:authTag:encryptedText
 * @param secretKey The secret key for decryption (must be 32 bytes).
 * @returns The decrypted string.
 */
export function decrypt(encryptedData: string, secretKey: string): string {
  if (!secretKey || secretKey.length !== KEY_LENGTH) {
    throw new Error(`Secret key must be exactly ${KEY_LENGTH} characters long.`);
  }

  const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');

  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error('Invalid encrypted data format.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
