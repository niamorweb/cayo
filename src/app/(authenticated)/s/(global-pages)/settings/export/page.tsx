"use client";
import React from "react";
import CardDisplay from "@/components/global/card-display";

export default function Page() {
  return (
    <CardDisplay
      href={"/s/settings"}
      title="Export"
      description="Export your private vault password in CSS or JSON file."
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm">Not available yet.</p>
      </div>
    </CardDisplay>
  );
}
