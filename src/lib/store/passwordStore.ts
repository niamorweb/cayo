import { create } from "zustand";
import { persist } from "zustand/middleware";

type PasswordStore = {
  passwords: any[];
  folders: any[];
  setPasswords: (pws: any[]) => void;
  setFolders: (f: any[]) => void;
  reset: () => void;
};

export const usePasswordStore = create<PasswordStore>()(
  persist(
    (set) => ({
      passwords: [],
      folders: [],
      setPasswords: (pws) => set({ passwords: pws }),
      setFolders: (f) => set({ folders: f }),
      reset: () => set({ passwords: [], folders: [] }),
    }),
    {
      name: "password-store",
    }
  )
);
