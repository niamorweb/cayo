"use client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ItemLeftDisplayProps {
  index?: number;
  name: string;
  description: string;
  illustration: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  isItemActive: boolean;
  href?: string;
}

export default function ItemLeftDisplay({
  index,
  name,
  description,
  illustration,
  icon = <ChevronRight />,
  onClick,
  isItemActive,
  href,
}: ItemLeftDisplayProps) {
  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="rounded-sm bg-white/80 outline outline-neutral-100 shrink-0 size-10 flex items-center justify-center">
          {illustration}
        </div>
        <div className="relative flex flex-col justify-start items-start gap-1">
          <div className="flex items-center gap-3">
            <span className="text-left flex-grow font-medium">{name}</span>
          </div>
          <span
            className={`flex-grow text-left ${
              href ? "text-xs" : "text-sm"
            } text-black/70`}
          >
            {description}
          </span>
        </div>
      </div>
      {icon}
    </>
  );

  // const baseClasses = `flex rounded-lg relative hover:bg-neutral-50 duration-150 items-center !h-[96px] p-3 cursor-pointer justify-between ${
  const baseClasses = `flex rounded-lg relative hover:bg-neutral-50 duration-150 items-center p-6 cursor-pointer justify-between ${
    isItemActive ? "!bg-accent" : ""
  }`;

  if (href) {
    return (
      <Link key={index} href={href} className={`${baseClasses}`}>
        {content}
      </Link>
    );
  }

  return (
    <button key={index} onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
}
