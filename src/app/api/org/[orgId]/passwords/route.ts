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

    const { data: memberData, error: memberError } = await adminSupabase
      .from("organizations_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: passwordsData, error: passwordsError } = await adminSupabase
      .from("passwords")
      .select("*, folder(*)")
      .eq("organization", orgId)
      .is("group_id", null);

    if (passwordsError) {
      console.error("Error fetching passwords:", passwordsError);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    let userEmails: any = {};
    if (["admin", "manager"].includes(memberData.role)) {
      const userIds = [...new Set(passwordsData.map((x) => x.user_id))];

      for (const userId of userIds) {
        const { data: userData } = await adminSupabase.auth.admin.getUserById(
          userId
        );
        if (userData?.user) {
          userEmails[userId] = userData.user.email;
        }
      }
    }

    const editedPasswordsData = passwordsData.map((x) => ({
      ...x,
      isOwnPassword: x.user_id === user.id,
      ...(["admin", "manager"].includes(memberData.role) && {
        email: userEmails[x.user_id],
      }),
    }));

    return NextResponse.json({
      passwords: editedPasswordsData,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
