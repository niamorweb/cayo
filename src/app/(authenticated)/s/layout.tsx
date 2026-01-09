import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-[#F9F9FB]">
        <AppSidebar />

        {/* Conteneur principal */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* HEADER MOBILE : Visible uniquement sur petit écran */}
          <header className="flex h-14 items-center gap-2 border-b border-neutral-200 bg-white px-4 md:hidden shrink-0">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-semibold">Cayo Vault</span>
          </header>

          {/* CONTENU DES PAGES */}
          <div className="flex-1 overflow-auto h-full w-full">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
