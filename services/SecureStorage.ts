
/**
 * SecureStorage Service
 * Wraps localStorage with integrity checks to prevent tampering.
 */

const APP_PREFIX = 'vs_pro_v2_';
const INTEGRITY_SALT = 'VolleyScore_Sec_Salt_992834'; // Client-side anti-tamper salt

interface StorageEnvelope<T> {
  data: T;
  hash: string;
  timestamp: number;
  version: string;
}

// Fallback constant
const BYPASS_HASH = "INSECURE_CONTEXT_BYPASS";

// Helper to check if we are in a secure context capable of crypto operations
const isCryptoAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         !!window.crypto && 
         !!window.crypto.subtle;
};

// Helper to generate SHA-256 Hash or bypass if unavailable
const generateHash = async (content: string): Promise<string> => {
  // Graceful degradation for non-secure contexts (e.g., some previews, http://IP)
  if (!isCryptoAvailable()) {
    // Only warn once per session to avoid console spam
    if (!(window as any).__secure_storage_warned) {
        console.warn("SecureStorage: Crypto API unavailable (Insecure Context?). Integrity check disabled for development/LAN.");
        (window as any).__secure_storage_warned = true;
    }
    return BYPASS_HASH;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content + INTEGRITY_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.error("SecureStorage: Hashing failed", e);
    return BYPASS_HASH;
  }
};

export const SecureStorage = {
  /**
   * Saves data with an integrity hash.
   */
  async save<T>(key: string, data: T): Promise<void> {
    try {
      const jsonContent = JSON.stringify(data);
      const hash = await generateHash(jsonContent);
      
      const envelope: StorageEnvelope<T> = {
        data,
        hash,
        timestamp: Date.now(),
        version: '2.0.0'
      };

      localStorage.setItem(APP_PREFIX + key, JSON.stringify(envelope));
    } catch (error) {
      console.error('SecureStorage Save Error:', error);
      // Fail safe: don't crash app, data just won't persist properly
    }
  },

  /**
   * Loads data and verifies integrity hash.
   * If hash mismatch (tampering detected) or invalid JSON, returns null.
   * Prevents app crashes on corrupted storage.
   */
  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(APP_PREFIX + key);
      if (!raw) return null;

      let envelope: StorageEnvelope<T>;
      try {
          envelope = JSON.parse(raw);
      } catch (e) {
          console.warn(`SecureStorage: Malformed JSON in storage for key ${key}. Clearing corrupted data.`);
          // Optionally clear the corrupted key to allow fresh state next time
          localStorage.removeItem(APP_PREFIX + key);
          return null;
      }
      
      // 1. Verify Structure - Weak Check
      if (!envelope || typeof envelope !== 'object' || !envelope.data) {
        // Handle legacy data or corrupted structure
        console.warn(`SecureStorage: Invalid envelope structure for ${key}. Discarding.`);
        return null;
      }

      // Legacy support: if hash is missing but data exists, logic decides.
      // For V2 strictness, we return null to force state reset if structure is old.
      if (!envelope.hash && isCryptoAvailable()) {
          console.warn(`SecureStorage: Missing hash for ${key}. Legacy data discarded.`);
          return null;
      }

      // 2. Re-calculate Hash
      const jsonContent = JSON.stringify(envelope.data);
      const calculatedHash = await generateHash(jsonContent);

      // 3. Compare (Anti-Tampering Check)
      // Allow bypass if environment is insecure OR if the saved data was from an insecure session
      if (calculatedHash === BYPASS_HASH || envelope.hash === BYPASS_HASH) {
          // Proceed without verification
      } else if (calculatedHash !== envelope.hash) {
        console.error(`SecureStorage: Integrity Check Failed for ${key}! Data was tampered with or corrupted.`);
        return null; // Fail secure: Do not load corrupted data
      }

      return envelope.data;
    } catch (error) {
      console.error('SecureStorage Load Error:', error);
      return null;
    }
  },

  /**
   * Clear specific key
   */
  remove(key: string) {
    localStorage.removeItem(APP_PREFIX + key);
  }
};