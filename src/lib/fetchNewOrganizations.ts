"use client";
import { useNewOrganizationStore } from "./store/useNewOrganizationStore";
import { createClient } from "./supabase/client";

let fetchPromise: Promise<void> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10000; // 10 secondes

export async function fetchNewOrganizations(forceRefresh = false) {
  const now = Date.now();

  if (fetchPromise && !forceRefresh) {
    return fetchPromise;
  }

  if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
    return;
  }

  fetchPromise = (async () => {
    const { setNewOrganizations } = useNewOrganizationStore.getState();
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setNewOrganizations([]);
      return;
    }

    const { data: organizationsMembers } = await supabase
      .from("organizations_members")
      .select("id, organization_id")
      .eq("user_id", userId)
      .eq("has_accepted", false);

    if (!organizationsMembers?.length) {
      setNewOrganizations([]);
      return;
    }

    const organizationIds = organizationsMembers.map(
      (member) => member.organization_id
    );

    try {
      const response = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la récupération des organizations"
        );
      }

      const organizations = await response.json();
      const orgMap = new Map(organizations.map((o: any) => [o.id, o.name]));

      const formattedOrgs = organizationsMembers.map((member) => ({
        organization_member_id: member.id,
        organization_id: member.organization_id,
        organization_name: (orgMap.get(member.organization_id) as string) || "",
      }));

      setNewOrganizations(formattedOrgs);
      lastFetchTime = Date.now();
    } catch (error) {
      console.error("Erreur lors de l'appel à /api/orgs:", error);
      setNewOrganizations([]);
    }
  })();

  try {
    await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}
