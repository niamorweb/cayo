// app/api/client-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";

export async function GET(request: NextRequest) {
  console.log("🟢 [API] Nouvelle requête reçue sur /api/client-info");

  // --- IP extraction ---
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");

  console.log("📦 Headers IP :");
  console.log("x-forwarded-for:", xForwardedFor);
  console.log("x-real-ip:", xRealIp);

  const ip = xForwardedFor?.split(",")[0].trim() || xRealIp || "unknown";

  console.log("✅ IP détectée :", ip);

  // --- User Agent ---
  const userAgent = request.headers.get("user-agent") || "unknown";
  console.log("🧠 User-Agent brut :", userAgent);

  // --- Parse User Agent ---
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  console.log("📱 Détails du device :", device);
  console.log("🌐 Détails du navigateur :", browser);
  console.log("💻 Détails de l'OS :", os);

  // --- Géolocalisation ---
  let geoData = { country: null, city: null };

  if (ip !== "unknown" && !["127.0.0.1", "::1"].includes(ip)) {
    console.log("🌍 Tentative de géolocalisation IP via ip-api.com...");
    try {
      const geoResponse = await fetch(`https://ip-api.com/json/${ip}`);
      console.log(
        "📡 Réponse brute IP-API :",
        geoResponse.status,
        geoResponse.statusText
      );

      if (geoResponse.ok) {
        const data = await geoResponse.json();
        console.log("📦 Données IP-API :", data);

        if (data.status === "success") {
          geoData = {
            country: data.country,
            city: data.city,
          };
          console.log("✅ Géolocalisation réussie :", geoData);
        } else {
          console.warn("⚠️ Géolocalisation échouée :", data.message);
        }
      } else {
        console.warn("⚠️ Erreur HTTP sur IP-API :", geoResponse.status);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la géolocalisation :", error);
    }
  } else {
    console.log("🏠 IP locale ou inconnue, géolocalisation ignorée.");
  }

  // --- Construction de la réponse ---
  const result = {
    ip,
    userAgent,
    country: geoData.country,
    city: geoData.city,
    deviceType: device.type || "desktop",
    browser: browser.name
      ? `${browser.name} ${browser.version || ""}`.trim()
      : "unknown",
    os: os.name ? `${os.name} ${os.version || ""}`.trim() : "unknown",
  };

  console.log("📤 Réponse finale envoyée :", result);

  return NextResponse.json(result);
}
