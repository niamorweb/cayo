"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  User,
  Shield,
  Download,
  Share,
  Settings,
  LogOut,
  Inbox,
  ShieldAlert,
} from "lucide-react";

// --- CONFIGURATION DES ONGLETS ---
const NAV_ITEMS = [
  {
    name: "Invitations",
    icon: Inbox,
    description: "Retrieve all your received invitations",
    href: "/s/notifications/invitations",
  },
  {
    name: "Security alerts",
    icon: ShieldAlert,
    description: "Security and authentication settings",
    href: "/s/notifications/alerts",
  },
];

// --- COMPOSANT D'ONGLET (TAB) ---
// Remplace ItemLeftDisplay pour un usage horizontal spécifique aux settings
const SettingsTab = ({
  item,
  isActive,
}: {
  item: (typeof NAV_ITEMS)[0];
  isActive: boolean;
}) => {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors outline-none",
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

      {/* Indicateur animé (Ligne bleue en bas) */}
      {isActive && (
        <motion.div
          layoutId="settings-active-tab"
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 rounded-t-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </Link>
  );
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#F9F9FB] w-full text-neutral-900">
      {/* --- HEADER STICKY --- */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shrink-0">
        {/* Titre de la section */}
        <div className="h-16 px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-neutral-100 p-2 rounded-lg border border-neutral-200">
              <Settings className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h1 className="!text-sm !tracking-tighter font-bold text-neutral-900 leading-none">
                Notifications
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Manage your invites and alerts
              </p>
            </div>
          </div>
        </div>

        {/* Navigation par Onglets (Scrollable sur mobile) */}
        <div className="px-6 md:px-8 flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            // @ts-ignore
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <SettingsTab key={item.href} item={item} isActive={isActive} />
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
