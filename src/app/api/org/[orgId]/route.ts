import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Vérifier si l'utilisateur est membre de l'organisation
    const { data: memberCheck, error: memberError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { data: organizations, error: orgError } = await adminSupabase
      .from("organizations")
      .select("*")
      .eq("id", orgId);

    if (orgError) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      );
    }

    if (!organizations || organizations.length === 0) {
      const { data: allOrgs, error: allOrgsError } = await adminSupabase
        .from("organizations")
        .select("id, name")
        .limit(5);

      return NextResponse.json(
        { error: "Organisation non trouvée dans la base de données" },
        { status: 404 }
      );
    }

    const organization = organizations[0];

    return NextResponse.json({
      organization: {
        ...organization,
        user_role: memberCheck.role,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
