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

    const adminSupabase = createAdminClient();

    const { data: adminCheck, error: adminError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user?.id)
      .single();

    if (adminError || !adminCheck) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    if (!["admin", "manager"].includes(adminCheck.role)) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    const { data: members, error: membersError } = await adminSupabase
      .from("organizations_members")
      .select("id, user_id, role, has_accepted, created_at")
      .eq("organization_id", orgId);

    if (membersError) {
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 }
      );
    }

    const membersWithEmails = await Promise.all(
      members.map(async (member, index) => {
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

    return NextResponse.json({ members: membersWithEmails });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
