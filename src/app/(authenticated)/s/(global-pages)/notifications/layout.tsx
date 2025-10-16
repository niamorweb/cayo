"use client";
import { ShieldAlert, Inbox } from "lucide-react";
import { usePathname } from "next/navigation";
import GlobalLayoutPage from "@/components/global/global-layout-page";
import ItemLeftDisplay from "@/components/global/item-left-display";
import { useNewOrganizationStore } from "@/lib/store/useNewOrganizationStore";

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

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBasePath = pathname === "/s/notifications";

  return (
    <GlobalLayoutPage
      name="Notifications"
      conditionToHide={!isBasePath}
      leftChildren={
        <nav className="flex-1 p-4">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <ItemLeftDisplay
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
