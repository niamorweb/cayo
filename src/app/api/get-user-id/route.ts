import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Missing email in request body" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Supabase error:", error.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const user = data.users.find((u) => u.email === email);

    return NextResponse.json({
      success: true,
      userId: user ? user.id : null,
    });
  } catch (err) {
    console.error("Handler error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
