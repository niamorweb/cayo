import { create } from "zustand";

type OrganizationInvitation = {
  organization_member_id: string;
  organization_id: string;
  organization_name: string;
};

type OrganizationStore = {
  newOrganizations: OrganizationInvitation[];
  setNewOrganizations: (orgs: OrganizationInvitation[]) => void;
  reset: () => void;
};

export const useNewOrganizationStore = create<OrganizationStore>((set) => ({
  newOrganizations: [],
  setNewOrganizations: (orgs) => set({ newOrganizations: orgs }),
  reset: () => set({ newOrganizations: [] }),
}));
