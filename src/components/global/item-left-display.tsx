"use client";

import { ChevronRight, Globe } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ItemLeftDisplayProps {
  badge?: React.ReactNode;
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
  badge,
  index,
  name,
  description,
  illustration,
  icon = <ChevronRight className="w-4 h-4 text-neutral-300" />,
  onClick,
  isItemActive,
  href,
}: ItemLeftDisplayProps) {
  // Contenu interne réutilisable
  const content = (
    <>
      <div className="flex items-center gap-4 min-w-0">
        {/* Container d'illustration (Logo) */}
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
            isItemActive
              ? "bg-white border-indigo-100 shadow-sm"
              : "bg-neutral-50 border-neutral-200 group-hover:bg-white group-hover:border-neutral-300"
          )}
        >
          {/* Si l'illustration est une icône (Globe), on la style, sinon on affiche l'image brute */}
          {React.isValidElement(illustration) && illustration.type === Globe ? (
            <Globe className="w-5 h-5 text-neutral-400" />
          ) : (
            <div className="w-6 h-6 flex items-center justify-center overflow-hidden rounded-full">
              {illustration}
            </div>
          )}
        </div>

        {/* Textes */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-semibold text-sm truncate",
                isItemActive ? "text-indigo-950" : "text-neutral-900"
              )}
            >
              {name}
            </span>
            {badge && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                {badge}
              </span>
            )}
          </div>
          <span
            className={cn(
              "text-xs truncate",
              isItemActive ? "text-indigo-500/80" : "text-neutral-500"
            )}
          >
            {description}
          </span>
        </div>
      </div>

      {/* Icône d'action (Flèche) */}
      <div
        className={cn(
          "transition-transform duration-300",
          isItemActive
            ? "translate-x-0 opacity-100"
            : "translate-x-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
        )}
      >
        {icon}
      </div>
    </>
  );

  // Classes de base pour le conteneur
  const containerClasses = cn(
    "group w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/20 relative overflow-hidden",
    isItemActive
      ? "bg-indigo-50/50 border-indigo-200 shadow-sm z-10"
      : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
  );

  if (href) {
    return (
      <Link key={index} href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button key={index} onClick={onClick} className={containerClasses}>
      {content}
    </button>
  );
}
