import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-screen min-h-screen ">
        <AppSidebar />
        <div className="flex-1 min-h-screen">{children}</div>
      </div>
    </SidebarProvider>
  );
}
