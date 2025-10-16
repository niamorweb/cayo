import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authSupabase = await createClient();
  const adminSupabase = createAdminClient();

  try {
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { organizationIds } = await req.json();

    if (!Array.isArray(organizationIds) || organizationIds.length === 0) {
      return NextResponse.json(
        { error: "organizationIds manquants ou invalides" },
        { status: 400 }
      );
    }

    const { data, error } = await adminSupabase
      .from("organizations")
      .select("id, name")
      .in("id", organizationIds);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Erreur Supabase" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Internal server error:", err);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
