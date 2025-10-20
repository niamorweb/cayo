"use client";
import { User, Shield, Download, Share } from "lucide-react";
import { usePathname } from "next/navigation";
import GlobalLayoutPage from "@/components/global/global-layout-page";
import ItemLeftDisplay from "@/components/global/item-left-display";
import SettingsLogout from "./logout";

const NAV_ITEMS = [
  {
    name: "Account",
    icon: User,
    description: "Manage your account informations.",
    href: "/s/settings/account",
  },
  {
    name: "Change password",
    icon: Shield,
    description: "Update your password to secure your account.",
    href: "/s/settings/security",
  },
  {
    name: "Export",
    icon: Share,
    description: "Export your private vault password in CSS or JSON file.",
    href: "/s/settings/export",
  },
  {
    name: "Import",
    icon: Download,
    description: "Import password in your private vault.",
    href: "/s/settings/import",
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBasePath = pathname === "/s/settings";
  const isSettingsSection = pathname.startsWith("/s/settings");

  return (
    <GlobalLayoutPage
      name="Account"
      conditionToHide={!isBasePath}
      leftChildren={
        <nav className="flex-1 px-3">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <ItemLeftDisplay
                key={index}
                index={index}
                name={item.name}
                description={item.description}
                illustration={<Icon className="stroke-[1px]" />}
                isItemActive={isActive}
                href={item.href}
                icon={null}
              />
            );
          })}
          <SettingsLogout />
        </nav>
      }
      mainChildren={
        !isBasePath && (
          <div className="flex-1 bg-neutral-100 overflow-auto">
            <div className="">{children}</div>
          </div>
        )
      }
    />
  );
}
