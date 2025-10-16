import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const { secureNoteId } = await request.json();

    const adminSupabase = createAdminClient();

    const { error: secureNoteError } = await adminSupabase
      .from("secure_send")
      .delete()
      .eq("id", secureNoteId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
