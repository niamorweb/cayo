import React from "react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function SkeletonPassword() {
  return (
    <div className="flex rounded-lg items-center h-24 p-3 justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="rounded-sm size-10" />
        <div className="flex flex-col items-start gap-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="size-5" />
    </div>
  );
}
