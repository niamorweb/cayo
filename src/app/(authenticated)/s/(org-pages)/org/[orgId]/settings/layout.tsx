"use client";
import {
  Users,
  Grid2X2Plus,
  Grid2X2,
  UserPlus,
  Building,
  Upload,
} from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useOrganizationStore } from "@/lib/store/organizationStore";
import GlobalLayoutPage from "@/components/global/global-layout-page";
import ItemLeftDisplay from "@/components/global/item-left-display";

export default function Layout({ children }: any) {
  const params = useParams();
  const pathname = usePathname();
  const organizations = useOrganizationStore((s) => s.organizations);
  const orgId = params.orgId as string;

  const currentOrganization = organizations?.find((org) => org.id === orgId);

  if (!currentOrganization) return null;

  const baseSettingsPath = `/s/org/${currentOrganization.id}/settings`;
  const isSettingsPage = pathname.startsWith(baseSettingsPath);
  const isSettingsRoot = pathname === baseSettingsPath;

  const navItems = [
    {
      name: "Add a member",
      icon: UserPlus,
      description: "Add a new member in the organization",
      href: `${baseSettingsPath}/add-member`,
      roleAccess: ["admin", "manager"],
    },
    {
      name: "Manage members",
      icon: Users,
      description: "Manage all organization members",
      href: `${baseSettingsPath}/members`,
      roleAccess: ["admin", "manager"],
    },
    {
      name: "Add a group",
      icon: Grid2X2Plus,
      description: "Add a new group in the organization",
      href: `${baseSettingsPath}/add-group`,
      roleAccess: ["admin", "manager"],
    },
    {
      name: "Manage groups",
      icon: Grid2X2,
      description: "Create and manage organizations groups",
      href: `${baseSettingsPath}/groups`,
      roleAccess: ["admin", "manager"],
    },
    {
      name: "Import",
      icon: Upload,
      description: "Import password in the organization.",
      href: `${baseSettingsPath}/import`,
      roleAccess: ["admin", "manager"],
    },
    {
      name: "Global",
      icon: Building,
      description: "Manage your organization settings",
      href: `${baseSettingsPath}/global`,
      roleAccess: ["admin"],
    },
  ];

  return (
    <GlobalLayoutPage
      name="Organization settings"
      conditionToHide={!isSettingsRoot}
      leftChildren={
        <nav className="flex-1 px-3">
          {navItems
            .filter((item) =>
              item.roleAccess.includes(currentOrganization.user_role)
            )
            .map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <ItemLeftDisplay
                  index={index}
                  key={index}
                  name={item.name}
                  description={item.description}
                  illustration={<Icon className="stroke-[1px]" />}
                  isItemActive={isActive}
                  icon={null}
                  href={item.href}
                />
              );
            })}
        </nav>
      }
      mainChildren={
        !isSettingsRoot && (
          <div className="flex-1 bg-neutral-100 overflow-auto">
            <div className="">{children}</div>
          </div>
        )
      }
    />
    // <div className="flex h-screen">
    //   {/* Sidebar */}
    //   {isSettingsPage && (
    //     <div
    //       className={cn(
    //         "w-full py-3 md:w-2/5 md:max-w-[400px] md:h-screen overflow-auto md:outline outline-neutral-200 md:flex flex-col gap-3",
    //         !isSettingsRoot && "hidden"
    //       )}
    //     >
    //       {/* Header */}
    //       <div className="px-3 py-4 border-b border-b-neutral-200 flex items-center gap-2 justify-between">
    //         <div className="flex items-center gap-2">
    //           <SidebarTrigger />
    //           <span className="text-xl font-medium">Organization settings</span>
    //         </div>
    //       </div>

    //       {/* Navigation */}
    //       <nav className="flex-1 px-3">
    //         {navItems.map((item) => {
    //           const Icon = item.icon;
    //           const isActive = pathname === item.href;

    //           return (
    //             <Link
    //               key={item.name}
    //               href={item.href}
    //               className={cn(
    //                 "rounded-lg hover:bg-neutral-50 duration-150 w-full flex items-center h-24 p-7 gap-3",
    //                 isActive && "bg-accent"
    //               )}
    //             >
    //               <Icon className="size-6 shrink-0" />
    //               <div className="flex-1 min-w-0">
    //                 <p className="font-medium text-sm">{item.name}</p>
    //                 <p className="text-xs text-muted-foreground mt-1">
    //                   {item.description}
    //                 </p>
    //               </div>
    //             </Link>
    //           );
    //         })}
    //       </nav>
    //     </div>
    //   )}

    //   {/* Main content */}
    //   {!isSettingsRoot && (
    //     <div className="flex-1 bg-neutral-100 overflow-auto">
    //       <div className="p-8">{children}</div>
    //     </div>
    //   )}
    // </div>
  );
}
