import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const { passwordId } = await request.json();

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: passwordData, error: passwordError } = await adminSupabase
      .from("passwords")
      .select("user_id, organization, trash")
      .eq("id", passwordId)
      .single();

    if (passwordError) {
      return NextResponse.json({ error: "Error" }, { status: 401 });
    }

    let isAuthorized = false;

    if (!passwordData.organization) {
      isAuthorized = passwordData.user_id === user.id;
    } else {
      const { data: adminCheck } = await adminSupabase
        .from("organizations_members")
        .select("role")
        .eq("organization_id", passwordData.organization)
        .eq("user_id", user.id)
        .single();

      isAuthorized =
        passwordData.user_id === user.id && adminCheck?.role === "admin";
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (passwordData.trash) {
      const { error: deleteError } = await adminSupabase
        .from("passwords")
        .delete()
        .eq("id", passwordId);

      if (deleteError) {
        return NextResponse.json(
          { error: "Erreur lors de la suppression" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Mot de passe supprimé définitivement avec succès",
      });
    } else {
      const { error: updateError } = await adminSupabase
        .from("passwords")
        .update({ trash: true })
        .eq("id", passwordId);

      if (updateError) {
        return NextResponse.json(
          { error: "Erreur lors du déplacement vers la corbeille" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Mot de passe déplacé vers la corbeille avec succès",
      });
    }
  } catch (error) {
    console.error("Error in DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { passwordId, updates } = await request.json();

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: passwordData, error: passwordError } = await adminSupabase
      .from("passwords")
      .select("user_id, organization, trash")
      .eq("id", passwordId)
      .single();

    if (passwordError) {
      return NextResponse.json({ error: "Error" }, { status: 401 });
    }

    let isAuthorized = false;

    if (!passwordData.organization) {
      isAuthorized = passwordData.user_id === user.id;
    } else {
      const { data: adminCheck } = await adminSupabase
        .from("organizations_members")
        .select("role")
        .eq("organization_id", passwordData.organization)
        .eq("user_id", user.id)
        .single();

      isAuthorized =
        passwordData.user_id === user.id && adminCheck?.role === "admin";
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error: updateError } = await adminSupabase
      .from("passwords")
      .update(updates)
      .eq("id", passwordId);

    if (updateError) {
      return NextResponse.json(
        { error: "Erreur lors de la modification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    console.error("Error in PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
