import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    const { userCredential, profileData, newOrgMemberData } =
      await request.json();

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

    if (adminError) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    if (!["admin", "manager"].includes(adminCheck?.role)) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email: userCredential.email,
      password: userCredential.password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json(
        { error: "Erreur création utilisateur", message: error },
        { status: 500 }
      );
    }

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: data?.user.id,
        personal_aes_encrypted_key: profileData.personal_aes_encrypted_key,
        personal_iv: profileData.personal_iv,
        personal_salt: profileData.personal_salt,
        rsa_public_key: profileData.rsa_public_key,
        iv_rsa_private_key: profileData.iv_rsa_private_key,
        encrypted_rsa_private_key: profileData.encrypted_rsa_private_key,
      });

    if (profileError) {
      return NextResponse.json(
        { error: "Erreur création profil" },
        { status: 500 }
      );
    }

    const { error: memberError } = await adminSupabase
      .from("organizations_members")
      .insert({
        user_id: data?.user.id,
        organization_id: orgId,
        role: "user",
        has_accepted: true,
        encrypted_aes_key: newOrgMemberData.encrypted_aes_key,
      });

    if (memberError) {
      return NextResponse.json(
        { error: "Erreur ajout membre" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
