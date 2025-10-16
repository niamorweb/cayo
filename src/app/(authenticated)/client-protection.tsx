"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ClientProtection({ children }: any) {
  const auth = useAuthStore((s) => s.user);
  const router = useRouter();
  const supabase = createClient();

  if (!auth) {
    supabase.auth.signOut();
    router.push("/login");
  }

  return children;
}
