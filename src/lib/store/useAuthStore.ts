import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthStore = {
  decryptedAesKey: string | null;
  user: any;
  profile: any;
  setDecryptedAesKey: (key: string) => void;
  setUser: (user: any) => void;
  setProfile: (profile: any) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      decryptedAesKey: null,
      user: null,
      profile: null,
      setDecryptedAesKey: (key) => set({ decryptedAesKey: key }),
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      reset: () =>
        set({
          decryptedAesKey: null,
          user: null,
          profile: null,
        }),
    }),
    {
      name: "auth-store",
    }
  )
);
