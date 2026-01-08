"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Building,
  Users,
  Grid2X2,
  Upload,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useOrganizationStore } from "@/lib/store/organizationStore";

// --- TYPES & CONFIG ---
type Role = "admin" | "manager" | "member" | "owner"; // Ajuste selon tes types réels

interface NavItem {
  name: string;
  href: string; // Le path final
  icon: any;
  roleAccess: string[];
  // Permet de garder l'onglet actif sur des sous-pages (ex: add-member)
  relatedPaths?: string[];
}

export default function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const organizations = useOrganizationStore((s) => s.organizations);
  const orgId = params.orgId as string;

  const currentOrganization = organizations?.find((org) => org.id === orgId);

  if (!currentOrganization) return null;

  const baseSettingsPath = `/s/org/${currentOrganization.id}/settings`;

  // --- CONFIGURATION DES ONGLETS (Regroupés) ---
  const NAV_ITEMS: NavItem[] = [
    {
      name: "General",
      icon: Building, // Ou Settings
      href: `${baseSettingsPath}/general`,
      roleAccess: ["admin"],
      relatedPaths: [],
    },
    {
      name: "Members",
      icon: Users,
      href: `${baseSettingsPath}/members`,
      roleAccess: ["admin", "manager"],
      relatedPaths: [`${baseSettingsPath}/add-member`],
    },
    {
      name: "Groups",
      icon: Grid2X2,
      href: `${baseSettingsPath}/groups`,
      roleAccess: ["admin", "manager"],
      relatedPaths: [`${baseSettingsPath}/add-group`],
    },
    {
      name: "Import",
      icon: Upload,
      href: `${baseSettingsPath}/import`,
      roleAccess: ["admin", "manager"],
      relatedPaths: [],
    },
  ];

  // Filtrage par rôle
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roleAccess.includes(currentOrganization.user_role)
  );

  return (
    <div className="flex flex-col h-full bg-[#F9F9FB] w-full text-neutral-900">
      {/* --- HEADER STICKY --- */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shrink-0">
        {/* Titre de la section */}
        <div className="h-16 px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
              <Building className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="!text-sm !tracking-tighter font-bold text-neutral-900 leading-none">
                {currentOrganization.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="!text-xs  text-neutral-500">
                  Organization Settings
                </span>
                {/* Petit badge de rôle pour info */}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 uppercase tracking-wide">
                  {currentOrganization.user_role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par Onglets */}
        <div className="px-6 md:px-8 flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            // Logique Active : Soit match exact, soit match avec relatedPaths
            const isActive =
              pathname === item.href || item.relatedPaths?.includes(pathname);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors outline-none whitespace-nowrap",
                  isActive
                    ? "text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-indigo-600" : "text-neutral-400"
                  )}
                />
                <span>{item.name}</span>

                {isActive && (
                  <motion.div
                    layoutId="org-settings-active-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 rounded-t-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* --- CONTENU --- */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
