"use client";

import { useOrganizationStore } from "@/lib/store/organizationStore";
import { createClient } from "./supabase/client";
import {
  decryptAesKeyWithPrivateKey,
  decryptPrivateKey,
} from "./encryption_aes";
import { useAuthStore } from "./store/useAuthStore";
import { decryptText } from "./encryption/text";
import { getFaviconUrl } from "./get-flavicon-url";
import { parse } from "path";

// --- Types Techniques ---

interface RawPassword {
  id: string;
  created_at: string;
  iv: string;
  name: string;
  password: string;
  username: string;
  note: string;
  url: string;
  folder: string | null;
  trash: boolean;
  modified_at: string;
  isOwnPassword?: boolean;
  email?: string;
}

interface RawGroup {
  id: string;
  name: string;
  user_role: "group_admin" | "member";
  joined_at: string;
}

// Type dynamique basé sur le retour de la fonction de déchiffrement
type DecryptedPassword = ReturnType<typeof decryptPasswordHelper>;

interface DecryptedGroup extends RawGroup {
  passwords: DecryptedPassword[];
}

// --- Cache & Global State ---

let fetchPromise: Promise<void> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10000;

/**
 * Helper de déchiffrement typé
 */
function decryptPasswordHelper(x: RawPassword, decryptedOrgAesKey: string) {
  const decryptedUrl = x.url
    ? decryptText(x.url, decryptedOrgAesKey, x.iv)
    : null;

  return {
    id: x.id,
    created_at: x.created_at,
    iv: x.iv,
    name: decryptText(x.name, decryptedOrgAesKey, x.iv),
    password: decryptText(x.password, decryptedOrgAesKey, x.iv),
    username: decryptText(x.username, decryptedOrgAesKey, x.iv),
    note: decryptText(x.note, decryptedOrgAesKey, x.iv),
    url: decryptedUrl,
    flavicon: decryptedUrl ? getFaviconUrl(parse(decryptedUrl)) : null,
    folder: x.folder,
    trash: x.trash,
    modified_at: x.modified_at,
    is_own_password: x.isOwnPassword,
    email: x.email,
  };
}

export async function fetchAndDecryptOrganizations(forceRefresh = false) {
  const now = Date.now();

  if (fetchPromise && !forceRefresh) return fetchPromise;
  if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) return;

  fetchPromise = (async () => {
    const decryptedAesKey = useAuthStore.getState().decryptedAesKey;
    const { setOrganizations, reset } = useOrganizationStore.getState();

    if (!decryptedAesKey) {
      reset();
      return;
    }

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      reset();
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      reset();
      return;
    }

    const decryptedPrivateKeyBytes = await decryptPrivateKey(
      profile.encrypted_rsa_private_key,
      decryptedAesKey,
      profile.iv_rsa_private_key
    );

    const decryptedPrivateKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(decryptedPrivateKeyBytes))
    );

    const { data: organizationsMembers } = await supabase
      .from("organizations_members")
      .select("*")
      .eq("user_id", userId)
      .eq("has_accepted", true);

    if (!organizationsMembers?.length) {
      reset();
      return;
    }

    const orgsPromises = organizationsMembers.map(async (member) => {
      try {
        const [orgFromFetch, decryptedOrgAesKey] = await Promise.all([
          getOrganization(member.organization_id),
          decryptAesKeyWithPrivateKey(
            member.encrypted_aes_key,
            decryptedPrivateKeyBase64
          ),
        ]);

        if (!orgFromFetch) return null;

        const [passwordsResponse, groupsResponse] = await Promise.all([
          fetch(`/api/org/${orgFromFetch.id}/passwords`),
          fetch(`/api/org/${orgFromFetch.id}/groups`),
        ]);

        const { passwords: passwordsData } = await passwordsResponse.json();
        const passwordsLisibles: DecryptedPassword[] =
          (passwordsData as RawPassword[])?.map((x) =>
            decryptPasswordHelper(x, decryptedOrgAesKey)
          ) || [];

        let groups: DecryptedGroup[] = []; // Correction ts(7034)

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();

          const groupsPromises = (groupsData.groups as RawGroup[]).map(
            async (group): Promise<DecryptedGroup> => {
              try {
                const groupPasswordsResponse = await fetch(
                  `/api/org/${orgFromFetch.id}/groups/${group.id}/passwords`
                );

                let groupPasswords: DecryptedPassword[] = []; // Correction ts(7034)

                if (groupPasswordsResponse.ok) {
                  const { passwords } = await groupPasswordsResponse.json();
                  groupPasswords =
                    (passwords as RawPassword[])?.map((x) =>
                      decryptPasswordHelper(x, decryptedOrgAesKey)
                    ) || [];
                }

                return {
                  ...group,
                  passwords: groupPasswords,
                };
              } catch (error) {
                return {
                  ...group,
                  passwords: [],
                };
              }
            }
          );

          groups = await Promise.all(groupsPromises);
        }

        const allPasswords = [
          ...passwordsLisibles.map((p) => ({
            ...p,
            group_id: null,
            group_name: null,
            source: "organization" as const,
          })),
          ...groups.flatMap((group) =>
            group.passwords.map((p) => ({
              ...p,
              group_id: group.id,
              group_name: group.name,
              source: "group" as const,
            }))
          ),
        ];

        return {
          ...orgFromFetch,
          decrypted_aes_key: decryptedOrgAesKey,
          organization_member_id: member.id,
          passwords: passwordsLisibles,
          groups: groups,
          all_passwords: allPasswords,
        };
      } catch (error) {
        console.error(`Error processing org ${member.organization_id}:`, error);
        return null;
      }
    });

    const allOrgs = await Promise.all(orgsPromises);
    const validOrgs = allOrgs.filter(
      (org): org is NonNullable<typeof org> => org !== null
    );

    setOrganizations(validOrgs);
    lastFetchTime = Date.now();
  })();

  try {
    await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}

const getOrganization = async (organizationId: string) => {
  const response = await fetch(`/api/org/${organizationId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Fetch failed");
  }

  const data = await response.json();
  return data.organization;
};
