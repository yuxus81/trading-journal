import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * "Angemeldet bleiben" support.
 *
 * When remember-me is checked we keep the session in localStorage (survives restarts).
 * Otherwise we store it in sessionStorage so it clears when the tab/browser closes. A
 * single flag decides which backing store new writes go to; reads fall back across both.
 */
const PERSIST_KEY = 'trading-journal.persist';

export function setSessionPersistence(persist: boolean): void {
  try {
    localStorage.setItem(PERSIST_KEY, persist ? '1' : '0');
  } catch {
    // Storage may be unavailable (private mode); ignore.
  }
}

function usePersistent(): boolean {
  try {
    // Default to persistent (remember-me checked) when no explicit choice was made.
    return localStorage.getItem(PERSIST_KEY) !== '0';
  } catch {
    return true;
  }
}

const hybridStorage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (usePersistent()) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch {
      // ignore write failures
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: hybridStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
