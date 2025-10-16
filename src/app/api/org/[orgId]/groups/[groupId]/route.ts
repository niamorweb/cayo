import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; groupId: string }> }
) {
  try {
    const { orgId, groupId } = await params;
    const { searchParams } = new URL(request.url);

    if (!groupId) {
      return NextResponse.json(
        { error: "ID du groupe requis" },
        { status: 400 }
      );
    }

    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: adminCheck, error: adminError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (adminError || !["admin", "manager"].includes(adminCheck?.role)) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    const { data: orgMember, error: orgError } = await adminSupabase
      .from("organizations_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette organisation" },
        { status: 403 }
      );
    }

    const { data: groupMember, error: memberError } = await adminSupabase
      .from("org_groups_members")
      .select(
        `
        id,
        role,
        org_groups!inner (
          id,
          org_id
        )
      `
      )
      .eq("user_id", user.id)
      .eq("group_id", groupId)
      .eq("org_groups.org_id", orgId)
      .single();

    if (memberError || !groupMember) {
      return NextResponse.json(
        { error: "Utilisateur non membre de ce groupe" },
        { status: 403 }
      );
    }

    const { error: groupDeleteError } = await adminSupabase
      .from("org_groups")
      .delete()
      .eq("id", groupId);

    if (groupId) {
      return NextResponse.json(
        { error: groupDeleteError && groupDeleteError },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Group deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; groupId: string }> }
) {
  try {
    const { orgId, groupId } = await params;
    const { name } = await request.json();

    if (!groupId || !name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group ID and new name required" },
        { status: 400 }
      );
    }

    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: adminCheck, error: adminError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (adminError || !["admin", "manager"].includes(adminCheck?.role)) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    const { data: groupMember, error: groupMemberError } = await adminSupabase
      .from("org_groups_members")
      .select(`id`)
      .eq("user_id", user.id)
      .single();

    if (!groupMember || groupMemberError) {
      return NextResponse.json(
        { error: "User not in the group" },
        { status: 403 }
      );
    }

    const { data: orgMember, error: orgError } = await adminSupabase
      .from("organizations_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette organisation" },
        { status: 403 }
      );
    }

    const { data: group, error: groupError } = await adminSupabase
      .from("org_groups")
      .select("id, name, org_id")
      .eq("id", groupId)
      .eq("org_id", orgId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: "Groupe introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    const { error: updateError } = await adminSupabase
      .from("org_groups")
      .update({ name: name.trim() })
      .eq("id", groupId);

    if (updateError) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du nom" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Nom du groupe mis à jour avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /group error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
