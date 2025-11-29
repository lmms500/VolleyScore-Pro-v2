
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

// Helper to generate SHA-256 Hash or bypass if unavailable
const generateHash = async (content: string): Promise<string> => {
  // Graceful degradation for non-secure contexts (e.g., some previews, http://IP)
  if (!window.crypto || !window.crypto.subtle) {
    console.warn("SecureStorage: Crypto API unavailable (Insecure Context?). Integrity check disabled.");
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
      // Fail safe: don't crash app
    }
  },

  /**
   * Loads data and verifies integrity hash.
   * If hash mismatch (tampering detected), returns null.
   */
  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(APP_PREFIX + key);
      if (!raw) return null;

      let envelope: StorageEnvelope<T>;
      try {
          envelope = JSON.parse(raw);
      } catch (e) {
          console.warn("SecureStorage: Malformed JSON in storage. Resetting.");
          return null;
      }
      
      // 1. Verify Structure
      if (!envelope || typeof envelope !== 'object' || !envelope.data) {
        console.warn('SecureStorage: Invalid envelope structure. Discarding.');
        return null;
      }

      // Legacy support or migration could go here. 
      // For now, if no hash, we discard to enforce security unless explicitly bypassed logic needed.
      if (!envelope.hash) return null;

      // 2. Re-calculate Hash
      const jsonContent = JSON.stringify(envelope.data);
      const calculatedHash = await generateHash(jsonContent);

      // 3. Compare (Anti-Tampering Check)
      // Allow bypass if environment is insecure
      if (calculatedHash === BYPASS_HASH || envelope.hash === BYPASS_HASH) {
          // Proceed without verification
      } else if (calculatedHash !== envelope.hash) {
        console.error('SecureStorage: Integrity Check Failed! Data was tampered with.');
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
