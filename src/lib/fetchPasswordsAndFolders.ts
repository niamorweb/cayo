"use client";
import { createClient } from "@/lib/supabase/client";
import { usePasswordStore } from "@/lib/store/passwordStore";

let fetchPromise: Promise<void> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5000;

export async function fetchAndStorePasswordsAndFolders(forceRefresh = false) {
  const now = Date.now();

  if (fetchPromise && !forceRefresh) {
    return fetchPromise;
  }

  if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
    return;
  }

  fetchPromise = (async () => {
    const supabase = createClient();
    const { setPasswords, setFolders } = usePasswordStore.getState();

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setPasswords([]);
      setFolders([]);
      return;
    }

    const userId = userData.user.id;

    const [{ data: passwordsData }, { data: foldersData }] = await Promise.all([
      supabase
        .from("passwords")
        .select("*, folder(*)")
        .eq("user_id", userId)
        .is("organization", null),
      supabase.from("password_folders").select("*").eq("user_id", userId),
    ]);

    setPasswords(passwordsData || []);
    setFolders(foldersData || []);

    lastFetchTime = Date.now();
  })();

  try {
    await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}
