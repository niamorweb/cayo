"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  ChevronsUpDown,
  Plus,
  Send,
  Settings,
  Shield,
  Trash,
  Bell,
  LayoutGrid,
  Search,
  Command,
  CheckCircle2,
} from "lucide-react";

// Radix Primitives (On garde la logique accessible du Dropdown, mais on style nous-même)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Stores & Logic
import { useOrganizationStore } from "@/lib/store/organizationStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { fetchNewOrganizations } from "@/lib/fetchNewOrganizations";
import { useNewOrganizationStore } from "@/lib/store/useNewOrganizationStore";
import { useSecureSendStore } from "@/lib/store/useSecureSendStore";

// --- COMPOSANT DE LIEN CUSTOM ---
const NavLink = ({
  href,
  isActive,
  icon: Icon,
  children,
  badge,
}: {
  href: string;
  isActive: boolean;
  icon: any;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "relative group flex items-center justify-between w-full px-3 py-2 rounded-md transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
        isActive ? "text-white" : "text-neutral-400 hover:text-neutral-200"
      )}
    >
      {/* Background actif animé */}
      {isActive && (
        <motion.div
          layoutId="nav-active-bg"
          className="absolute inset-0 bg-[#1A1A1A] border border-white/5 rounded-md shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}

      <div className="relative z-10 flex items-center gap-3">
        <Icon
          className={cn(
            "w-4 h-4 transition-colors",
            isActive
              ? "text-indigo-400"
              : "text-neutral-500 group-hover:text-neutral-300"
          )}
        />
        <span className="text-[13px] font-medium tracking-tight">
          {children}
        </span>
      </div>

      {badge && <div className="relative z-10">{badge}</div>}
    </Link>
  );
};

export function AppSidebar() {
  // --- LOGIC ---
  const { fetchSecureSends } = useSecureSendStore();
  const newOrganizations = useNewOrganizationStore((s) => s.newOrganizations);
  const organizations = useOrganizationStore((s) => s.organizations);
  const auth = useAuthStore((s) => s.user);

  const pathname = usePathname();
  const params = useParams();
  const orgId = params.orgId as string;

  useEffect(() => {
    fetchAndStorePasswordsAndFolders();
    fetchAndDecryptOrganizations();
    fetchNewOrganizations();
    fetchSecureSends();
  }, []);

  const currentOrganization = organizations?.find((org) => org.id === orgId);
  const hasNotifications = newOrganizations && newOrganizations.length > 0;

  // Helpers pour les routes actives
  const isVaultActive =
    pathname === (currentOrganization ? `/s/org/${orgId}/vault` : `/s/vault`);
  const isTrashActive =
    pathname ===
    (currentOrganization ? `/s/org/${orgId}/vault/trash` : `/s/vault/trash`);
  const isSecureSendActive =
    pathname ===
    (currentOrganization ? `/s/org/${orgId}/secure-send` : `/s/secure-send`);
  const isCreateOrg = pathname === `/s/create-organization`;
  const isManageActive =
    currentOrganization && pathname.startsWith(`/s/org/${orgId}/settings`);

  return (
    <aside className="w-[260px] h-screen bg-[#050505] border-r border-white/5 flex flex-col shrink-0 sticky top-0 z-50">
      {/* --- 1. HEADER (Org Switcher) --- */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group w-full flex items-center justify-between p-2 rounded-xl bg-[#0F0F0F] border border-white/5 hover:border-white/10 hover:bg-[#141414] transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/5 flex items-center justify-center text-white">
                  {currentOrganization ? (
                    <LayoutGrid className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Shield className="w-4 h-4 text-indigo-400" />
                  )}
                  {hasNotifications && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-[#0F0F0F] rounded-full" />
                  )}
                </div>
                <div className="flex flex-col items-start truncate">
                  <span className="text-[13px] text-left font-medium text-white truncate w-full leading-none mb-1">
                    {currentOrganization
                      ? currentOrganization.name
                      : "Private Vault"}
                  </span>
                  <span className="text-[11px] text-neutral-500 truncate leading-none">
                    Free Plan
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
            </button>
          </DropdownMenuTrigger>

          {/* CUSTOM DROPDOWN STYLE */}
          <DropdownMenuContent
            className="w-[228px] bg-[#111111] border border-white/10 text-neutral-200 shadow-2xl rounded-xl p-1.5 ml-2"
            align="start"
            sideOffset={4}
          >
            <div className="px-2 py-1.5 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
              Switch Workspace
            </div>

            <Link href="/s/vault">
              <DropdownMenuItem className="focus:bg-white/5 focus:text-white rounded-md text-[13px] cursor-pointer py-2">
                <span className="flex items-center">
                  <Shield className="mr-2 h-4 w-4 text-neutral-400" /> Private
                  Vault
                </span>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator className="bg-white/5 my-1" />

            {organizations &&
              organizations.map((org) => (
                <Link key={org.id} href={"/s/org/" + org.id + "/vault"}>
                  <DropdownMenuItem className="focus:bg-white/5 focus:text-white rounded-md text-[13px] cursor-pointer py-2">
                    <span className="flex items-center">
                      <div className="mr-2 h-4 w-4 rounded bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                        {org.name.charAt(0)}
                      </div>
                      {org.name}
                    </span>
                  </DropdownMenuItem>
                </Link>
              ))}

            <DropdownMenuSeparator className="bg-white/5 my-1" />

            <Link href="/s/notifications/invitations">
              <DropdownMenuItem className="focus:bg-white/5 focus:text-white rounded-md text-[13px] cursor-pointer py-2 flex justify-between">
                <span className="flex items-center">
                  <Bell className="mr-2 h-4 w-4 text-neutral-400" />{" "}
                  Notifications
                </span>
                {hasNotifications && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                )}
              </DropdownMenuItem>
            </Link>

            <Link href="/s/settings/account">
              <DropdownMenuItem className="focus:bg-white/5 focus:text-white rounded-md text-[13px] cursor-pointer py-2">
                <span className="flex items-center">
                  <Settings className="mr-2 h-4 w-4 text-neutral-400" /> Account
                </span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Fake Search Bar (UX Pattern) */}
        <button className="w-full mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F0F0F] text-neutral-500 hover:text-neutral-300 hover:bg-[#141414] transition-colors border border-transparent hover:border-white/5 group">
          <Search className="w-3.5 h-3.5" />
          <span className="text-[12px]">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-neutral-500 opacity-100 group-hover:text-neutral-300">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* --- 2. NAVIGATION LINKS --- */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-6 custom-scrollbar">
        {/* GROUP: MAIN */}
        <div className="space-y-0.5">
          <div className="px-3 mb-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-wider font-mono">
            Assets
          </div>

          <NavLink
            href={currentOrganization ? `/s/org/${orgId}/vault` : "/s/vault"}
            isActive={isVaultActive}
            icon={Shield}
          >
            All Passwords
          </NavLink>

          <NavLink
            href={
              currentOrganization
                ? `/s/org/${orgId}/secure-send`
                : "/s/secure-send"
            }
            isActive={isSecureSendActive}
            icon={Send}
          >
            Secure Send
          </NavLink>

          <NavLink
            href={
              currentOrganization
                ? `/s/org/${orgId}/vault/trash`
                : "/s/vault/trash"
            }
            isActive={isTrashActive}
            icon={Trash}
          >
            Trash
          </NavLink>
        </div>

        {/* GROUP: MANAGEMENT */}
        <div className="space-y-0.5">
          <div className="px-3 mb-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-wider font-mono">
            Workspace
          </div>

          {!currentOrganization && (
            <NavLink
              href="/s/create-organization"
              isActive={isCreateOrg}
              icon={Plus}
            >
              Create Organization
            </NavLink>
          )}

          {currentOrganization &&
            ["admin", "manager"].includes(currentOrganization.user_role) && (
              <NavLink
                href={`/s/org/${orgId}/settings/general`}
                isActive={isManageActive}
                icon={Settings}
              >
                Manage Team
              </NavLink>
            )}

          {/* Fake Link for UX demo */}
          <div className="px-3 py-2 flex items-center gap-3 text-neutral-600 cursor-not-allowed opacity-50">
            <Command className="w-4 h-4" />
            <span className="text-[13px]">Audit Log (Pro)</span>
          </div>
        </div>
      </nav>

      {/* --- 3. FOOTER (Status) --- */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-colors cursor-default">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-neutral-300 leading-none mb-0.5">
              System Operational
            </span>
            <span className="text-[10px] text-neutral-600 leading-none font-mono">
              v2.4.0-beta
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
