import { useState, useEffect, useCallback } from 'react';
import { PlayerProfile } from '../types';
import { SecureStorage } from '../services/SecureStorage';
import { v4 as uuidv4 } from 'uuid';

const PROFILES_STORAGE_KEY = 'player_profiles_master';

/**
 * usePlayerProfiles Hook
 * Manages master player profile database with async loading
 * Always sets isReady = true (even on failure) to prevent blocking the app
 */
export const usePlayerProfiles = () => {
  const [profiles, setProfiles] = useState<Map<string, PlayerProfile>>(new Map());
  const [isReady, setIsReady] = useState(false);

  // Load profiles ONCE on component mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const storedData = await SecureStorage.load<PlayerProfile[]>(PROFILES_STORAGE_KEY);
        if (isMounted && storedData && Array.isArray(storedData)) {
          const map = new Map<string, PlayerProfile>();
          storedData.forEach(p => map.set(p.id, p));
          setProfiles(map);
        }
      } catch (err) {
        console.error('[usePlayerProfiles] Load failed:', err);
        // Continue anyway - profiles will be empty but app won't block
      }
      
      // Mark as ready regardless of load success
      if (isMounted) {
        setIsReady(true);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  // Auto-save profiles when they change
  useEffect(() => {
    if (!isReady) return;
    const data = Array.from(profiles.values());
    SecureStorage.save(PROFILES_STORAGE_KEY, data).catch(err => {
      console.error('[usePlayerProfiles] Save failed:', err);
    });
  }, [profiles, isReady]);

  const upsertProfile = useCallback((name: string, skillLevel: number, id?: string): PlayerProfile => {
    const cleanName = name.trim();
    const existing = id ? profiles.get(id) : undefined;
    
    const newProfile: PlayerProfile = {
      id: existing?.id || uuidv4(),
      name: cleanName,
      skillLevel: Math.min(5, Math.max(1, skillLevel)),
      createdAt: existing?.createdAt || Date.now(),
      lastUpdated: Date.now()
    };

    setProfiles(prev => {
      const next = new Map(prev);
      next.set(newProfile.id, newProfile);
      return next;
    });

    return newProfile;
  }, [profiles]);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const findProfileByName = useCallback((name: string): PlayerProfile | undefined => {
    const search = name.trim().toLowerCase();
    for (const profile of profiles.values()) {
      if (profile.name.toLowerCase() === search) return profile;
    }
    return undefined;
  }, [profiles]);

  const getProfile = useCallback((id: string) => profiles.get(id), [profiles]);

  return {
    profiles,
    upsertProfile,
    deleteProfile,
    findProfileByName,
    getProfile,
    isReady
  };
};
