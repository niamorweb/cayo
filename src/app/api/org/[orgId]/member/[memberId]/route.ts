import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      orgId: string;
      memberId: string;
    }>;
  }
) {
  try {
    const body = await request.json();
    const { action, has_accepted, role } = body;

    const { orgId, memberId } = await params;

    const authSupabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (action === "status") {
      const { data: memberUpdated, error: memberUpdatedError } =
        await adminSupabase
          .from("organizations_members")
          .update({ has_accepted: has_accepted })
          .eq("id", memberId)
          .eq("user_id", user?.id)
          .eq("organization_id", orgId);

      if (memberUpdatedError) {
        return NextResponse.json(
          { error: "An error has occured !" },
          { status: 401 }
        );
      }
    }

    if (action === "role") {
      const { data: requestingMember, error: requestingMemberError } =
        await adminSupabase
          .from("organizations_members")
          .select("id, role")
          .eq("organization_id", orgId)
          .eq("user_id", user.id)
          .single();

      if (requestingMemberError || !requestingMember) {
        return NextResponse.json(
          { error: "Accès non autorisé" },
          { status: 403 }
        );
      }

      if (requestingMember.role !== "admin") {
        return NextResponse.json(
          { error: "Seuls les admins peuvent changer les rôles" },
          { status: 403 }
        );
      }

      if (requestingMember.id == memberId) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas changer votre propre rôle" },
          { status: 403 }
        );
      }

      const { data: updatedMember, error: updateError } = await adminSupabase
        .from("organizations_members")
        .update({ role: role })
        .eq("id", memberId)
        .eq("organization_id", orgId);
    }

    return NextResponse.json({
      message: "Membre mis à jour avec succès",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      memberId: string;
      orgId: string;
    }>;
  }
) {
  try {
    const { orgId, memberId } = await params;

    const authSupabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: targetMember, error: targetMemberError } = await adminSupabase
      .from("organizations_members")
      .select("organization_id")
      .eq("id", memberId)
      .single();

    if (!targetMember) {
      return NextResponse.json(
        { error: "The user is unknown" },
        { status: 401 }
      );
    }

    const { data: requestMember, error: requestMemberError } =
      await adminSupabase
        .from("organizations_members")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("organization_id", targetMember.organization_id)
        .single();

    if (!requestMember) {
      return NextResponse.json(
        { error: "The user is unknown" },
        { status: 401 }
      );
    }

    if (requestMember.id == memberId) {
      await adminSupabase
        .from("organizations_members")
        .delete()
        .eq("id", memberId);

      return NextResponse.json({
        message: "Membre supprimé avec succès",
      });
    }

    if (requestMember.role !== "admin") {
      return NextResponse.json({ error: "No permission" }, { status: 401 });
    }

    const { data: deletedMember, error: deletedMemberError } =
      await adminSupabase
        .from("organizations_members")
        .delete()
        .eq("id", memberId);

    return NextResponse.json({
      message: "Membre supprimé avec succès",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
