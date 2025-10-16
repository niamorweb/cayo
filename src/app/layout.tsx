import type { Metadata } from "next";
import { Geist, Epilogue } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cayo - Secure Password Management for Teams & Families ",
  description:
    "Manage passwords securely with your team and family using end-to-end encryption. Centralized management, role permissions, and multi-device sync for safe credential sharing.RéessayerClaude peut faire des erreurs. Assurez-vous de vérifier ses réponses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${epilogue.variable} ${epilogue.className} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
