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

    const { data: userGroups, error: groupsError } = await adminSupabase
      .from("org_groups_members")
      .select(
        `
       role,
       created_at,
       org_groups!inner (
         id,
         name,
         created_at,
         org_id
       )
     `
      )
      .eq("user_id", user.id)
      .eq("org_groups.org_id", orgId);

    if (groupsError) {
      return NextResponse.json({ error: groupsError.message }, { status: 500 });
    }

    const groups = userGroups.map((item) => ({
      id: (item.org_groups as any).id,
      name: (item.org_groups as any).name,
      group_created_at: (item.org_groups as any).created_at,
      user_role: item.role,
      joined_at: item.created_at,
    }));

    return NextResponse.json({
      groups,
      total: groups.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const { groupName, orgMembersId = [] } = await request.json();

    if (!groupName?.trim()) {
      return NextResponse.json(
        { error: "Nom du groupe requis" },
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

    const { data: orgGroupCreated, error: orgGroupError } = await adminSupabase
      .from("org_groups")
      .insert({
        name: groupName.trim(),
        org_id: orgId,
      })
      .select("id")
      .single();

    if (orgGroupError) {
      return NextResponse.json(
        { error: orgGroupError.message },
        { status: 500 }
      );
    }

    const { error: memberError } = await adminSupabase
      .from("org_groups_members")
      .insert({
        user_id: user.id,
        group_id: orgGroupCreated.id,
        role: "group_admin",
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    orgMembersId.forEach(async (memberId: any) => {
      const { data: memberToAdd, error: memberToAddError } = await adminSupabase
        .from("organizations_members")
        .select("user_id")
        .eq("organization_id", orgId)
        .eq("id", memberId)
        .single();

      const { error: memberError } = await adminSupabase
        .from("org_groups_members")
        .insert({
          user_id: memberToAdd?.user_id,
          group_id: orgGroupCreated.id,
          role: "member",
        });
    });

    return NextResponse.json({
      success: true,
      groupId: orgGroupCreated.id,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
