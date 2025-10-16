import React from "react";
import { SidebarTrigger } from "../ui/sidebar";

export default function GlobalLayoutPage({
  name,
  conditionToHide,
  leftChildren,
  mainChildren,
  actionButton,
}: {
  name: string;
  conditionToHide: boolean;
  leftChildren: React.ReactNode;
  mainChildren?: React.ReactNode;
  actionButton?: React.ReactNode;
}) {
  return (
    <div className="flex bg-white">
      <div
        className={`w-full py-3 md:w-2/5 md:max-w-[400px] md:h-screen overflow-auto md:outline outline-neutral-200 md:flex flex-col gap-2 ${
          conditionToHide && "hidden"
        }`}
      >
        <div className="h-[68px] px-3 py-4 border-b border-b-neutral-200 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xl font-medium">{name}</span>
            </div>
          </div>
          {actionButton}
        </div>
        {leftChildren}
      </div>

      {mainChildren}
    </div>
  );
}
