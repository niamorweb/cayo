import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: adminCheck, error: adminError } = await supabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (adminError || !adminCheck) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    if (adminCheck.role !== "admin") {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    const { error: membersDeleteError } = await supabase
      .from("organizations_members")
      .delete()
      .eq("organization_id", orgId);

    if (membersDeleteError) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression des membres" },
        { status: 500 }
      );
    }

    const { error: orgDeleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);

    if (orgDeleteError) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression de l'organisation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Organisation supprimée avec succès",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
