import { create } from "zustand";
import { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  display_name: string;
  personal_aes_encrypted_key: string;
  personal_iv: string;
  personal_salt: string;
  rsa_public_key: string;
  encrypted_rsa_private_key: string;
  iv_rsa_private_key: string;
  // Ajoute ici d'autres champs si nécessaire
}

type AuthStore = {
  decryptedAesKey: string | null;
  user: User | null;
  profile: UserProfile | null;
  inactivityTimer: NodeJS.Timeout | null;
  setDecryptedAesKey: (key: string | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  reset: () => void;
  startInactivityTimer: () => void;
  resetActivity: () => void;
};

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const useAuthStore = create<AuthStore>((set, get) => ({
  decryptedAesKey: null,
  user: null,
  profile: null,
  inactivityTimer: null,

  setDecryptedAesKey: (key) => {
    set({ decryptedAesKey: key });
    if (key) {
      get().startInactivityTimer();
    }
  },

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  reset: () => {
    const timer = get().inactivityTimer;
    if (timer) clearTimeout(timer);

    set({
      decryptedAesKey: null,
      user: null,
      profile: null,
      inactivityTimer: null,
    });
  },

  startInactivityTimer: () => {
    const existingTimer = get().inactivityTimer;
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      get().reset();
      if (typeof window !== "undefined") {
        window.location.href = "/login?timeout=1";
      }
    }, INACTIVITY_TIMEOUT);

    set({ inactivityTimer: timer });
  },

  resetActivity: () => {
    if (get().decryptedAesKey) {
      get().startInactivityTimer();
    }
  },
}));
