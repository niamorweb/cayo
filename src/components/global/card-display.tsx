import BackButton from "@/app/(authenticated)/s/(org-pages)/org/[orgId]/settings/back-button";
import React from "react";

interface CardDisplayProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actionBtns?: React.ReactNode;
  href?: string;
}

export default function CardDisplay({
  title,
  description,
  children,
  actionBtns,
  href,
}: CardDisplayProps) {
  return (
    <div className="bg-neutral-100 w-full h-screen overflow-auto p-8 flex justify-center">
      <div className="settings-layout-page">
        {href && <BackButton href={href} />}
        <div className="flex-1 flex flex-col gap-6">
          <div className="p-6 bg-white rounded-3xl flex flex-col  gap-5 w-full">
            <div className=" flex flex-col">
              <span className="text-2xl font-medium">{title}</span>
              <p className="text-base text-neutral-700">{description}</p>
            </div>
            <div className="flex flex-col w-full gap-3">{children}</div>
          </div>
          {actionBtns && (
            <div className="w-full flex items-center gap-3 justify-end">
              {actionBtns}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
