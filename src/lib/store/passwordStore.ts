import { create } from "zustand";

export type Password = {
  id: string;
  created_at: string;
  name: string;
  username: string;
  password: string; // Mot de passe déchiffré
  url: string;
  note: string;
  flavicon: string;
  folder_id: string | null;
  trash: boolean;
  iv: string;
  modified_at?: string;
  folder?: any;
};

export type Folder = {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
};

type PasswordStore = {
  passwords: Password[];
  folders: Folder[];
  setPasswords: (pws: Password[]) => void;
  setFolders: (f: Folder[]) => void;
  reset: () => void;
};

export const usePasswordStore = create<PasswordStore>((set) => ({
  passwords: [],
  folders: [],

  setPasswords: (pws) => set({ passwords: pws }),

  setFolders: (f) => set({ folders: f }),

  reset: () =>
    set({
      passwords: [],
      folders: [],
    }),
}));
