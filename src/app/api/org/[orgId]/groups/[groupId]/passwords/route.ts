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
      .select("id, role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette organisation" },
        { status: 403 }
      );
    }

    const { data: groupMember, error: groupError } = await adminSupabase
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

    if (groupError || !groupMember) {
      return NextResponse.json(
        { error: "Accès non autorisé à ce groupe" },
        { status: 403 }
      );
    }

    const { data: passwords, error: passwordsError } = await adminSupabase
      .from("passwords")
      .select("*")
      .eq("group_id", groupId)
      .eq("trash", false);

    if (passwordsError) {
      return NextResponse.json(
        { error: passwordsError.message },
        { status: 500 }
      );
    }

    let userEmails: any = {};
    if (["admin", "manager"].includes(orgMember.role)) {
      const userIds = [...new Set(passwords.map((x) => x.user_id))];

      for (const userId of userIds) {
        const { data: userData } = await adminSupabase.auth.admin.getUserById(
          userId
        );
        if (userData?.user) {
          userEmails[userId] = userData.user.email;
        }
      }
    }

    const passwordsWithOwnership =
      passwords?.map((password) => ({
        ...password,
        isOwnPassword: password.created_by === user.id,

        ...(["admin", "manager"].includes(orgMember.role) && {
          email: userEmails[password.user_id],
        }),
      })) || [];

    return NextResponse.json({
      passwords: passwordsWithOwnership,
      total: passwordsWithOwnership.length,
      group_role: groupMember.role,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
