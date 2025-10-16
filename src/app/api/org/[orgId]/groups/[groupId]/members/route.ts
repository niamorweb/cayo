import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; groupId: string }> }
) {
  try {
    const { orgId, groupId } = await params;

    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: orgMember, error: orgError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette organisation" },
        { status: 403 }
      );
    }

    if (!["admin", "manager"].includes(orgMember.role)) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to perform this action. - rôle admin ou manager requis",
        },
        { status: 403 }
      );
    }

    const { data: groupMember, error: groupMemberError } = await adminSupabase
      .from("org_groups_members")
      .select(
        `
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

    if (groupMemberError || !groupMember) {
      return NextResponse.json(
        { error: "Accès non autorisé - vous devez être membre du groupe" },
        { status: 403 }
      );
    }

    const { data: groupMembers, error: membersError } = await adminSupabase
      .from("org_groups_members")
      .select(
        `
        id,
       role,
       created_at,
       user_id
     `
      )
      .eq("group_id", groupId);

    if (membersError) {
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 }
      );
    }

    const membersWithEmails = await Promise.all(
      groupMembers.map(async (member, index) => {
        const { data: userData, error: userError } =
          await adminSupabase.auth.admin.getUserById(member.user_id);

        if (userError) {
        } else {
        }

        return {
          ...member,
          email: userData?.user?.email || null,
        };
      })
    );

    return NextResponse.json({
      group_members: membersWithEmails,
      total: membersWithEmails.length,
      your_role: groupMember.role,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; groupId: string }> }
) {
  try {
    const { orgId, groupId } = await params;
    const { userId, role = "member" } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
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

    // Vérifier que l'utilisateur est admin/manager de l'organisation
    const { data: orgMember, error: orgError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette organisation" },
        { status: 403 }
      );
    }

    if (!["admin", "manager"].includes(orgMember.role)) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to perform this action. - rôle admin ou manager requis",
        },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur courant est membre du groupe
    const { data: currentUserGroupMember, error: currentUserGroupError } =
      await adminSupabase
        .from("org_groups_members")
        .select(
          `
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

    if (currentUserGroupError || !currentUserGroupMember) {
      return NextResponse.json(
        { error: "Vous devez être membre du groupe pour ajouter des membres" },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur à ajouter est membre de l'organisation
    const { data: targetOrgMember, error: targetOrgError } = await adminSupabase
      .from("organizations_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .single();

    if (targetOrgError || !targetOrgMember) {
      return NextResponse.json(
        { error: "L'utilisateur n'est pas membre de cette organisation" },
        { status: 400 }
      );
    }

    const { data: existingMember, error: existingError } = await adminSupabase
      .from("org_groups_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (!existingError && existingMember) {
      return NextResponse.json(
        { error: "L'utilisateur est déjà membre de ce groupe" },
        { status: 400 }
      );
    }

    const { data: newMember, error: insertError } = await adminSupabase
      .from("org_groups_members")
      .insert({
        group_id: groupId,
        user_id: userId,
        role: role,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      member: newMember,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; groupId: string }> }
) {
  try {
    const { orgId, groupId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
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

    // Vérifier que l'utilisateur est admin/manager de l'organisation
    const { data: orgMember, error: orgError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette organisation" },
        { status: 403 }
      );
    }

    if (!["admin", "manager"].includes(orgMember.role)) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to perform this action. - rôle admin ou manager requis",
        },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur courant est membre du groupe
    const { data: currentUserGroupMember, error: currentUserGroupError } =
      await adminSupabase
        .from("org_groups_members")
        .select(
          `
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

    if (currentUserGroupError || !currentUserGroupMember) {
      return NextResponse.json(
        {
          error: "Vous devez être membre du groupe pour supprimer des membres",
        },
        { status: 403 }
      );
    }

    // Vérifier que le membre à supprimer existe dans le groupe
    const { data: memberToDelete, error: memberError } = await adminSupabase
      .from("org_groups_members")
      .select("id, role")
      .eq("group_id", groupId)
      .eq("id", userId)
      .single();

    if (memberError || !memberToDelete) {
      return NextResponse.json(
        { error: "L'utilisateur n'est pas membre de ce groupe" },
        { status: 400 }
      );
    }

    // Empêcher qu'un utilisateur se supprime lui-même s'il est le seul admin du groupe
    if (user.id === userId && memberToDelete.role === "group_admin") {
      const { data: adminCount } = await adminSupabase
        .from("org_groups_members")
        .select("id", { count: "exact" })
        .eq("group_id", groupId)
        .eq("role", "group_admin");

      if (adminCount && adminCount.length <= 1) {
        return NextResponse.json(
          {
            error:
              "Impossible de supprimer le dernier administrateur du groupe",
          },
          { status: 400 }
        );
      }
    }

    // Supprimer le membre du groupe
    const { error: deleteError } = await adminSupabase
      .from("org_groups_members")
      .delete()
      .eq("group_id", groupId)
      .eq("id", userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Membre supprimé du groupe",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
