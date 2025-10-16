"use client";

import React from "react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";

export default function Logout() {
  const supabase = createClient();

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
  };

  return <Button onClick={() => logout()}>Se déconnecter</Button>;
}
