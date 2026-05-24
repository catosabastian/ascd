import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.ENCRYPTION_SECRET || 'threadforge-default-secret-key-32b';

// Derive a 32-byte key from the secret string
function getKey(): Buffer {
  return crypto.createHash('sha256').update(SECRET).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  // Store as iv:ciphertext (both hex-encoded)
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  try {
    const [ivHex, encHex] = ciphertext.split(':');
    if (!ivHex || !encHex) return '';
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export function maskKey(plaintext: string): string {
  if (!plaintext || plaintext.length < 8) return '••••••••';
  const first = plaintext.slice(0, 4);
  const last = plaintext.slice(-3);
  const dots = '•'.repeat(Math.max(4, plaintext.length - 7));
  return `${first}${dots}${last}`;
}
