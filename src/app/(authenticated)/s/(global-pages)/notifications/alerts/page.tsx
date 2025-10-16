"use client";
import React from "react";
import CardDisplay from "@/components/global/card-display";

export default function Page() {
  return (
    <CardDisplay
      href={"/s/notifications"}
      title="Security alerts"
      description="Find here all your security alerts."
    >
      <div className="flex flex-col">
        <div>No alerts</div>
      </div>
    </CardDisplay>
  );
}
