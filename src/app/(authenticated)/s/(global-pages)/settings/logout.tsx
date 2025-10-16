"use client";
import { Button } from "@/components/ui/button";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useNewOrganizationStore } from "@/lib/store/useNewOrganizationStore";
import { useSecureSendStore } from "@/lib/store/useSecureSendStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import React from "react";

export default function SettingsLogout() {
  const router = useRouter();
  const { reset: secureSendsReset } = useSecureSendStore();

  const authReset = useAuthStore((s) => s.reset);
  const orgsReset = useOrganizationStore((s) => s.reset);
  const newOrgsReset = useNewOrganizationStore((s) => s.reset);

  const logOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (!error) {
      authReset();
      orgsReset();
      newOrgsReset();
      secureSendsReset();
      localStorage.clear();
      sessionStorage.clear();
      router.push("/login");
    }
  };

  return (
    <Button
      onClick={() => logOut()}
      className="w-full mt-4 h-[68px]"
      size="lg"
      variant="destructive"
    >
      Logout
    </Button>
  );
}
