import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const authSupabase = await createClient();

    const adminSupabase = createAdminClient();

    const {
      data: { user: requestUser },
    } = await authSupabase.auth.getUser();

    if (!requestUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: adminCheck, error: adminError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", requestUser.id)
      .single();

    if (adminError) {
      return NextResponse.json(
        { error: "You have to be in the organization." },
        { status: 403 }
      );
    }

    if (!["admin", "manager"].includes(adminCheck.role)) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    if (!requestUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      data: { users },
      error,
    } = await adminSupabase.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const user = users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const { data: profileData, error: profileError } = await adminSupabase
      .from("profiles")
      .select("rsa_public_key")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message });
    }
    return NextResponse.json({
      id: user.id,
      public_key: profileData.rsa_public_key,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
