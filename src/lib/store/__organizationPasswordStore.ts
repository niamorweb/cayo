import { create } from "zustand";

type DecryptedPassword = {
  id: string;
  created_at: string;
  iv: string;
  name: string;
  password: string;
  username: string;
  note: string;
  url: string;
  flavicon: string;
  folder: string | null;
  trash: boolean;
};

type OrgPasswordsStore = {
  passwordsByOrg: Record<string, DecryptedPassword[]>;
  setPasswordsForOrg: (orgId: string, passwords: DecryptedPassword[]) => void;
  getPasswordsForOrg: (orgId: string) => DecryptedPassword[] | null;
  reset: () => void;
};

export const useOrganizationPasswordsStore = create<OrgPasswordsStore>()(
  (set, get) => ({
    passwordsByOrg: {},
    setPasswordsForOrg: (orgId, passwords) =>
      set((state) => ({
        passwordsByOrg: {
          ...state.passwordsByOrg,
          [orgId]: passwords,
        },
      })),
    getPasswordsForOrg: (orgId) => get().passwordsByOrg[orgId] || null,
    reset: () => set({ passwordsByOrg: {} }),
  })
);
