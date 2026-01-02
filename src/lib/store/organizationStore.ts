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

type Group = {
  id: string;
  name: string;
  user_role: "group_admin" | "member";
  joined_at: string;
  passwords: DecryptedPassword[];
};

type Organization = {
  id: string;
  name: string;
  decrypted_aes_key: string;
  organization_member_id: string;
  passwords: DecryptedPassword[];
  groups: Group[];
  [key: string]: any;
};

type OrganizationStore = {
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
  addOrganization: (org: Organization) => void;
  getOrganizationKey: (orgId: string) => string | null;

  // Méthodes pour les mots de passe d’organisation
  getOrganizationPasswords: (orgId: string) => DecryptedPassword[];
  setOrganizationPasswords: (
    orgId: string,
    passwords: DecryptedPassword[]
  ) => void;
  addPasswordToOrganization: (
    orgId: string,
    password: DecryptedPassword
  ) => void;
  updatePasswordInOrganization: (
    orgId: string,
    passwordId: string,
    updatedPassword: Partial<DecryptedPassword>
  ) => void;
  removePasswordFromOrganization: (orgId: string, passwordId: string) => void;

  // Méthodes pour les groupes
  getOrganizationGroups: (orgId: string) => Group[];
  setOrganizationGroups: (orgId: string, groups: Group[]) => void;
  addGroupToOrganization: (orgId: string, group: Group) => void;

  // Méthodes pour les mots de passe des groupes
  getGroupPasswords: (orgId: string, groupId: string) => DecryptedPassword[];
  setGroupPasswords: (
    orgId: string,
    groupId: string,
    passwords: DecryptedPassword[]
  ) => void;
  addPasswordToGroup: (
    orgId: string,
    groupId: string,
    password: DecryptedPassword
  ) => void;
  updatePasswordInGroup: (
    orgId: string,
    groupId: string,
    passwordId: string,
    updatedPassword: Partial<DecryptedPassword>
  ) => void;
  removePasswordFromGroup: (
    orgId: string,
    groupId: string,
    passwordId: string
  ) => void;

  reset: () => void;
};

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  organizations: [],

  setOrganizations: (orgs) => set({ organizations: orgs }),

  addOrganization: (org) =>
    set((state) => {
      const exists = state.organizations.some((o) => o.id === org.id);
      if (exists) return state;
      return {
        organizations: [
          ...state.organizations,
          {
            ...org,
            passwords: org.passwords || [],
            groups: org.groups || [],
          },
        ],
      };
    }),

  getOrganizationKey: (orgId) => {
    const org = get().organizations.find((o) => o.id === orgId);
    return org?.decrypted_aes_key || null;
  },

  // Passwords d’organisation
  getOrganizationPasswords: (orgId) => {
    const org = get().organizations.find((o) => o.id === orgId);
    return org?.passwords || [];
  },

  setOrganizationPasswords: (orgId, passwords) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId ? { ...org, passwords } : org
      ),
    })),

  addPasswordToOrganization: (orgId, password) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? { ...org, passwords: [...(org.passwords || []), password] }
          : org
      ),
    })),

  updatePasswordInOrganization: (orgId, passwordId, updatedPassword) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              passwords: (org.passwords || []).map((pwd) =>
                pwd.id === passwordId ? { ...pwd, ...updatedPassword } : pwd
              ),
            }
          : org
      ),
    })),

  removePasswordFromOrganization: (orgId, passwordId) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              passwords: (org.passwords || []).filter(
                (pwd) => pwd.id !== passwordId
              ),
            }
          : org
      ),
    })),

  // 👥 Groupes
  getOrganizationGroups: (orgId) => {
    const org = get().organizations.find((o) => o.id === orgId);
    return org?.groups || [];
  },

  setOrganizationGroups: (orgId, groups) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId ? { ...org, groups } : org
      ),
    })),

  addGroupToOrganization: (orgId, group) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? { ...org, groups: [...(org.groups || []), group] }
          : org
      ),
    })),

  // Passwords des groupes
  getGroupPasswords: (orgId, groupId) => {
    const org = get().organizations.find((o) => o.id === orgId);
    const group = org?.groups?.find((g) => g.id === groupId);
    return group?.passwords || [];
  },

  setGroupPasswords: (orgId, groupId, passwords) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              groups: (org.groups || []).map((group) =>
                group.id === groupId ? { ...group, passwords } : group
              ),
            }
          : org
      ),
    })),

  addPasswordToGroup: (orgId, groupId, password) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              groups: (org.groups || []).map((group) =>
                group.id === groupId
                  ? {
                      ...group,
                      passwords: [...(group.passwords || []), password],
                    }
                  : group
              ),
            }
          : org
      ),
    })),

  updatePasswordInGroup: (orgId, groupId, passwordId, updatedPassword) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              groups: (org.groups || []).map((group) =>
                group.id === groupId
                  ? {
                      ...group,
                      passwords: (group.passwords || []).map((pwd) =>
                        pwd.id === passwordId
                          ? { ...pwd, ...updatedPassword }
                          : pwd
                      ),
                    }
                  : group
              ),
            }
          : org
      ),
    })),

  removePasswordFromGroup: (orgId, groupId, passwordId) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? {
              ...org,
              groups: (org.groups || []).map((group) =>
                group.id === groupId
                  ? {
                      ...group,
                      passwords: (group.passwords || []).filter(
                        (pwd) => pwd.id !== passwordId
                      ),
                    }
                  : group
              ),
            }
          : org
      ),
    })),

  reset: () => set({ organizations: [] }),
}));
