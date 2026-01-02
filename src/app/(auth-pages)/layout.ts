import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const user = await supabase.auth.getUser();

  if (user.data.user) redirect("/start");

  return children;
}
