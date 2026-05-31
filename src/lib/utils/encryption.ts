/**
 * Simple encryption utilities for localStorage
 * Uses Web Crypto API for secure encryption
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

/**
 * Generate encryption key from password
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt data
 */
export async function encrypt(data: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(data),
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength,
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data
 */
export async function decrypt(
  encryptedData: string,
  password: string,
): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0),
    );

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate a device-specific encryption key
 * Uses browser fingerprint as password
 */
export function getDeviceKey(): string {
  // Create a simple device fingerprint
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
    screen.colorDepth,
  ].join("|");

  // Hash the fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `insightify-${Math.abs(hash).toString(36)}`;
}

/**
 * Secure storage wrapper with encryption
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (typeof localStorage === "undefined") return false;
      const deviceKey = getDeviceKey();
      const encrypted = await encrypt(value, deviceKey);
      localStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error("Failed to save encrypted data:", error);
      return false;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof localStorage === "undefined") return null;
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const deviceKey = getDeviceKey();
      return await decrypt(encrypted, deviceKey);
    } catch (error) {
      console.error("Failed to read encrypted data:", error);
      // If decryption fails, remove corrupted data
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
      return null;
    }
  },

  removeItem(key: string): boolean {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to remove item:", error);
      return false;
    }
  },

  clear(): boolean {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Failed to clear storage:", error);
      return false;
    }
  },
};
