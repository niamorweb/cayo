"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useInactivityDetection } from "@/hooks/useInactivityDetection";
import { ReactNode, useEffect } from "react";

export default function ClientProtection({
  children,
}: {
  children: ReactNode;
}) {
  const auth = useAuthStore((s) => s.user);
  const router = useRouter();
  const supabase = createClient();
  const decryptedAesKey = useAuthStore((state) => state.decryptedAesKey);

  useInactivityDetection();

  useEffect(() => {
    if (!decryptedAesKey || !auth) {
      supabase.auth.signOut();
      router.push("/login");
    }
  }, [decryptedAesKey, router]);

  // if (!auth) {
  //   supabase.auth.signOut();
  //   router.push("/login");
  // }

  return children;
}
