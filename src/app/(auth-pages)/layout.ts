import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Layout({ children }: any) {
  const supabase = await createClient();

  const user = await supabase.auth.getUser();

  if (user.data.user) redirect("/start");

  return children;
}
