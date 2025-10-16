"use client";

import { createClient } from "@/lib/supabase/client";
import { useNewOrganizationStore } from "@/lib/store/useNewOrganizationStore";

export async function fetchAndStoreNewOrganizations() {
  const supabase = createClient();
  const setNewOrganizations =
    useNewOrganizationStore.getState().setNewOrganizations;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    setNewOrganizations([]);
    return;
  }

  const { data: organizationsMembersData } = await supabase
    .from("organizations_members")
    .select("*")
    .eq("user_id", userId)
    .is("has_accepted", false);

  if (!organizationsMembersData || organizationsMembersData.length === 0) {
    setNewOrganizations([]);
    return;
  }

  const newOrganizations = [];

  for (const member of organizationsMembersData) {
    const { data: organizationsData } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", member.organization_id);

    if (organizationsData && organizationsData.length > 0) {
      newOrganizations.push({
        organization_member_id: member.id,
        organization_id: member.organization_id, // Ajoutez cette ligne
        organization_name: organizationsData[0].name,
      });
    }
  }

  setNewOrganizations(newOrganizations);
}
