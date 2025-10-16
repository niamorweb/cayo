// layout-double-display.tsx
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface LayoutContext {
  isBasePath: boolean;
  pathname: string;
}

const LayoutContext = createContext<LayoutContext | null>(null);

const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context)
    throw new Error("Component must be used within LayoutDoubleDisplay");
  return context;
};

interface LayoutDoubleDisplayProps {
  children: React.ReactNode;
  basePath: string;
}

export function SplitLayout({ children, basePath }: LayoutDoubleDisplayProps) {
  const pathname = usePathname();
  const isBasePath = pathname === basePath;

  return (
    <LayoutContext.Provider value={{ isBasePath, pathname }}>
      <div className="flex w-full h-screen">{children}</div>
    </LayoutContext.Provider>
  );
}

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

function Sidebar({ children, className }: SidebarProps) {
  const { isBasePath } = useLayoutContext();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 w-full md:w-[320px] bg-white border-r shadow-sm",
        !isBasePath && "hidden md:flex",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SidebarHeaderProps {
  children: React.ReactNode;
}

function SidebarHeader({ children }: SidebarHeaderProps) {
  return (
    <div className="p-6 flex items-center gap-2 border-b border-b-neutral-200">
      {children}
    </div>
  );
}

interface SidebarNavProps {
  children: React.ReactNode;
}

function SidebarNav({ children }: SidebarNavProps) {
  return <nav className="flex-1 px-3">{children}</nav>;
}

interface NavItemProps {
  name: string;
  icon: LucideIcon;
  description: string;
  href: string;
}

function NavItem({ name, icon: Icon, description, href }: NavItemProps) {
  const { pathname } = useLayoutContext();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg hover:bg-neutral-50 duration-150 w-full flex items-center h-24 p-7 gap-3",
        isActive && "bg-accent"
      )}
    >
      <Icon className="size-6 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </Link>
  );
}

interface ContentProps {
  children: React.ReactNode;
}

function Content({ children }: ContentProps) {
  const { isBasePath } = useLayoutContext();

  if (isBasePath) return null;

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="p-8">{children}</div>
    </div>
  );
}

interface ContentProps {
  children: React.ReactNode;
}

function Title({ children }: ContentProps) {
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="p-8">{children}</div>
    </div>
  );
}

function Description({ children }: ContentProps) {
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="p-8">{children}</div>
    </div>
  );
}

SplitLayout.Sidebar = Sidebar;
SplitLayout.SidebarHeader = SidebarHeader;
SplitLayout.SidebarNav = SidebarNav;
SplitLayout.NavItem = NavItem;
SplitLayout.Content = Content;
SplitLayout.Title = Title;
SplitLayout.Description = Description;

export default SplitLayout;
