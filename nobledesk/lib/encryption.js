import crypto from "crypto";

// Encrypts sensitive fields (SSN, bank account/routing numbers) before they
// ever touch the database. Requires a 32-byte key in ENCRYPTION_KEY (hex).
// Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY is missing or invalid - must be a 64-character hex string.");
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv + authTag + ciphertext together, base64-encoded.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decrypt(stored) {
  if (!stored) return null;
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// Shows only the last 4 characters, for display in lists without decrypting.
export function maskLast4(plainTextOrNull, fallbackLength = 4) {
  if (!plainTextOrNull) return "";
  const digits = plainTextOrNull.replace(/\D/g, "");
  return `••••${digits.slice(-fallbackLength)}`;
}
