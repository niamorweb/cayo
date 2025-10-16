"use client";
import {
  ChevronsUpDown,
  Plus,
  Send,
  Settings,
  Shield,
  Trash,
  User2,
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useEffect } from "react";
import { fetchAndStorePasswordsAndFolders } from "@/lib/fetchPasswordsAndFolders";
import { fetchAndDecryptOrganizations } from "@/lib/fetchAndDecryptOrganizations.ts";
import { fetchNewOrganizations } from "@/lib/fetchNewOrganizations";
import { useNewOrganizationStore } from "@/lib/store/useNewOrganizationStore";
import { useSecureSendStore } from "@/lib/store/useSecureSendStore";

export function AppSidebar() {
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

  const currentOrganization =
    organizations && organizations.find((org) => org.id === orgId);

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
    currentOrganization &&
    pathname.startsWith(currentOrganization && `/s/org/${orgId}/settings`);

  return (
    <Sidebar>
      <SidebarContent className="py-4">
        <SidebarGroup>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="relative overflow-hidden w-full sidebar-link-white text-left ">
                <div className="flex items-center gap-2">
                  <div className="bg-primary relative text-white aspect-square w-10 flex items-center justify-center rounded-md">
                    {newOrganizations && newOrganizations.length > 0 && (
                      <div className="size-4 bg-green-400 border border-white rounded-full absolute -top-1 -right-1"></div>
                    )}
                    <User2 className="size-4" />
                  </div>
                  <div className="flex flex-col text-sm">
                    <span>
                      {currentOrganization
                        ? currentOrganization.name
                        : "Private Space"}
                    </span>
                    <span className="text-black/60 text-xs">
                      {auth ? auth.email : "example@email.com"}
                    </span>
                  </div>
                </div>
                <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 stroke-[2px] text-black/85 size-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Only you</DropdownMenuLabel>
              <Link href={"/s/vault"}>
                <DropdownMenuItem>Private Space</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>My organizations</DropdownMenuLabel>
              <DropdownMenuGroup>
                {organizations &&
                  organizations.map((org, i) => (
                    <Link key={i} href={"/s/org/" + org.id + "/vault"}>
                      <DropdownMenuItem> {org.name}</DropdownMenuItem>
                    </Link>
                  ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <Link
                href={
                  newOrganizations && newOrganizations.length > 0
                    ? "/s/notifications/invitations"
                    : "/s/notifications"
                }
              >
                <DropdownMenuItem>
                  {newOrganizations && newOrganizations.length > 0 && (
                    <div className="size-4 bg-green-400 border border-white rounded-full absolute top-0 left-24"></div>
                  )}
                  Notifications
                </DropdownMenuItem>
              </Link>
              <Link href={"/s/settings/"}>
                <DropdownMenuItem>Account</DropdownMenuItem>
              </Link>
              {/* <DropdownMenuItem onClick={() => logOut()} variant="destructive">
                Log out
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarGroup>

        <div className="flex flex-col gap-2 px-3 text-sm mt-4">
          <Link
            href={
              currentOrganization ? "/s/org/" + orgId + "/vault" : "/s/vault"
            }
            className={`${
              isVaultActive ? "sidebar-link active" : "sidebar-link "
            }`}
          >
            <Shield />
            All passwords
          </Link>
          <Link
            href={
              currentOrganization
                ? "/s/org/" + orgId + "/vault/trash"
                : "/s/vault/trash"
            }
            className={`${
              isTrashActive ? "sidebar-link active" : "sidebar-link "
            }`}
          >
            <Trash />
            Trash
          </Link>
          <Link
            href={
              currentOrganization
                ? "/s/org/" + orgId + "/secure-send"
                : "/s/secure-send"
            }
            className={`${
              isSecureSendActive ? "sidebar-link active" : "sidebar-link "
            }`}
          >
            <Send />
            Secure Send
          </Link>
          {!currentOrganization && (
            <Link
              href="/s/create-organization"
              className={`${
                isCreateOrg ? "sidebar-link active" : "sidebar-link "
              }`}
            >
              <Plus />
              Create an organization
            </Link>
          )}
          {currentOrganization &&
            ["admin", "manager"].includes(currentOrganization.user_role) && (
              <Link
                href={`/s/org/${orgId}/settings`}
                className={`${
                  isManageActive ? "sidebar-link active" : "sidebar-link "
                }`}
              >
                <Settings />
                Manage
              </Link>
            )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
