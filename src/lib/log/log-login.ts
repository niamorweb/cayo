import { createClient } from "@/lib/supabase/client";

interface LoginLogData {
  userId: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

export async function logUserLogin(userId: string) {
  try {
    const supabase = createClient();

    // Récupère IP et User Agent depuis l'API route
    const response = await fetch("/api/client-info");
    const clientInfo = await response.json();

    const { error } = await supabase.from("user_login_logs").insert({
      user_id: userId,
      ip_address: clientInfo.ip || "unknown",
      user_agent: clientInfo.userAgent || "unknown",
      country: clientInfo.country || null,
      city: clientInfo.city || null,
      device_type: clientInfo.deviceType || "desktop",
      browser: clientInfo.browser || "unknown",
      os: clientInfo.os || "unknown",
    });

    if (error) {
      console.error("Failed to log login:", error);
    }
  } catch (error) {
    console.error("Error logging login:", error);
  }
}
